from fastapi.responses import JSONResponse

from .extraction import MAX_UPLOAD_BYTES


MAX_MULTIPART_OVERHEAD_BYTES = 64 * 1024


class UploadTooLarge(Exception):
    pass


class UploadRequestSizeLimitMiddleware:
    def __init__(self, app):
        self.app = app
        self.limit = MAX_UPLOAD_BYTES + MAX_MULTIPART_OVERHEAD_BYTES

    async def __call__(self, scope, receive, send):
        is_upload = (
            scope['type'] == 'http'
            and scope.get('method') == 'POST'
            and scope.get('path', '').startswith('/projects/')
            and scope.get('path', '').endswith('/documents')
        )
        if not is_upload:
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get('headers', []))
        content_length = headers.get(b'content-length')
        if content_length:
            try:
                if int(content_length) > self.limit:
                    await JSONResponse(
                        status_code=413,
                        content={'detail': 'Files may not exceed 10 MiB.'},
                    )(scope, receive, send)
                    return
            except ValueError:
                pass

        received = 0
        response_started = False

        async def limited_receive():
            nonlocal received
            message = await receive()
            if message['type'] == 'http.request':
                received += len(message.get('body', b''))
                if received > self.limit:
                    raise UploadTooLarge()
            return message

        async def tracked_send(message):
            nonlocal response_started
            if message['type'] == 'http.response.start':
                response_started = True
            await send(message)

        try:
            await self.app(scope, limited_receive, tracked_send)
        except UploadTooLarge:
            if response_started:
                raise
            await JSONResponse(
                status_code=413,
                content={'detail': 'Files may not exceed 10 MiB.'},
            )(scope, receive, send)
