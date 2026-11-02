import io
import re
import zipfile
import zlib
from xml.etree import ElementTree

from PyPDF2 import PdfFileReader
from PyPDF2.utils import PdfReadError
from .segmentation import segment_blocks


MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_DOCX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024
MAX_DOCX_ENTRIES = 2000
MAX_PDF_PAGES = 100
MAX_REQUIREMENTS = 500
WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'


class ExtractionError(ValueError):
    pass


class UnsupportedFileError(ValueError):
    pass


def _validate_docx(data):
    try:
        archive = zipfile.ZipFile(io.BytesIO(data))
    except (zipfile.BadZipFile, OSError):
        raise ExtractionError('The DOCX file is not a valid Office document.')

    with archive:
        entries = archive.infolist()
        if len(entries) > MAX_DOCX_ENTRIES:
            raise ExtractionError('The DOCX archive contains too many entries.')
        if sum(entry.file_size for entry in entries) > MAX_DOCX_UNCOMPRESSED_BYTES:
            raise ExtractionError('The uncompressed DOCX content exceeds the allowed size.')
        if any(entry.flag_bits & 1 for entry in entries):
            raise ExtractionError('Encrypted DOCX files are not supported.')
        names = {entry.filename for entry in entries}
        if '[Content_Types].xml' not in names or 'word/document.xml' not in names:
            raise ExtractionError('The DOCX file is missing required Word document content.')
        for entry in entries:
            if entry.filename.lower().endswith('.xml'):
                try:
                    content = archive.read(entry)
                except (zipfile.BadZipFile, OSError, RuntimeError, zlib.error):
                    raise ExtractionError('The DOCX archive contains unreadable XML content.')
                if re.search(br'<!\s*(DOCTYPE|ENTITY)\b', content, re.IGNORECASE):
                    raise ExtractionError('DOCX files containing XML declarations are not supported.')
                try:
                    ElementTree.fromstring(content)
                except ElementTree.ParseError:
                    raise ExtractionError('The DOCX archive contains invalid XML.')


def _xml_text(element):
    parts = []
    for node in element.iter():
        if node.tag == '{{{}}}t'.format(WORD_NS) and node.text:
            parts.append(node.text)
        elif node.tag == '{{{}}}tab'.format(WORD_NS):
            parts.append(' ')
        elif node.tag in ('{{{}}}br'.format(WORD_NS), '{{{}}}cr'.format(WORD_NS)):
            parts.append('\n')
    return ''.join(parts).strip()


def _extract_docx(data):
    _validate_docx(data)
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            root = ElementTree.fromstring(archive.read('word/document.xml'))
    except (ValueError, KeyError, zipfile.BadZipFile, ElementTree.ParseError,
            OSError, RuntimeError, zlib.error) as exc:
        raise ExtractionError('The DOCX file could not be read: {}'.format(exc))

    blocks = []
    paragraph_number = 0
    table_number = 0
    body = root.find('.//{{{}}}body'.format(WORD_NS))
    if body is None:
        raise ExtractionError('The DOCX document body is missing.')
    for child in list(body):
        if child.tag == '{{{}}}p'.format(WORD_NS):
            paragraph_number += 1
            text = _xml_text(child)
            if text:
                blocks.append({
                    'text': text,
                    'page': None,
                    'paragraph': paragraph_number,
                    'table': None,
                    'row': None,
                    'cell': None,
                })
        elif child.tag == '{{{}}}tbl'.format(WORD_NS):
            table_number += 1
            rows = child.findall('./{{{}}}tr'.format(WORD_NS))
            for row_number, row in enumerate(rows, 1):
                cells = row.findall('./{{{}}}tc'.format(WORD_NS))
                for cell_number, cell in enumerate(cells, 1):
                    text = _xml_text(cell)
                    if text:
                        blocks.append({
                            'text': text,
                            'page': None,
                            'paragraph': None,
                            'table': table_number,
                            'row': row_number,
                            'cell': cell_number,
                        })
    return blocks


def _extract_pdf(data):
    if b'%PDF-' not in data[:1024]:
        raise ExtractionError('The uploaded file does not contain a valid PDF signature.')
    try:
        reader = PdfFileReader(io.BytesIO(data), strict=False)
        if reader.isEncrypted:
            raise ExtractionError('Please provide an unencrypted PDF.')
        page_count = reader.getNumPages()
        if page_count > MAX_PDF_PAGES:
            raise ExtractionError('PDFs may contain at most {} pages.'.format(MAX_PDF_PAGES))
        blocks = []
        for page_number in range(page_count):
            text = reader.getPage(page_number).extractText() or ''
            if text.strip():
                blocks.append({
                    'text': text.strip(),
                    'page': page_number + 1,
                    'paragraph': None,
                    'table': None,
                    'row': None,
                    'cell': None,
                })
    except ExtractionError:
        raise
    except (PdfReadError, ValueError, OSError, KeyError, IndexError) as exc:
        raise ExtractionError('The PDF could not be read: {}'.format(exc))
    if not blocks:
        raise ExtractionError(
            'No usable text was found. Upload TXT/DOCX or a searchable PDF.'
        )
    return blocks, page_count


def extract_document(filename, data):
    if len(data) > MAX_UPLOAD_BYTES:
        raise ExtractionError('Files may not exceed 10 MiB.')
    suffix = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if suffix == 'txt':
        try:
            text = data.decode('utf-8-sig')
        except UnicodeDecodeError:
            raise ExtractionError('Text files must use UTF-8 encoding; please resave the file.')
        if '\x00' in text:
            raise ExtractionError('The uploaded text file appears to be binary.')
        if not text.strip():
            raise ExtractionError('The uploaded document is empty.')
        return segment_blocks([{'text': text.strip(), 'page': None, 'paragraph': None,
                                'table': None, 'row': None, 'cell': None}]), None
    if suffix == 'docx':
        if not data.startswith(b'PK'):
            raise ExtractionError('The DOCX file does not have a valid ZIP signature.')
        blocks = _extract_docx(data)
        if not blocks:
            raise ExtractionError('The DOCX document contains no usable text.')
        return segment_blocks(blocks), None
    if suffix == 'pdf':
        blocks, page_count = _extract_pdf(data)
        return segment_blocks(blocks), page_count
    raise UnsupportedFileError('Supported file types are TXT, DOCX and text-based PDF.')


def clean_original_filename(filename):
    basename = filename.replace('\\', '/').rsplit('/', 1)[-1]
    basename = ''.join(char for char in basename if char.isprintable())
    return basename[:255] or 'uploaded-document'
