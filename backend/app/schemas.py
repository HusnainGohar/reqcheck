import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, constr, root_validator, validator


class ProjectCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=1, max_length=120)
    description: constr(max_length=1000) = ''


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: str


class ProjectListResponse(BaseModel):
    items: list
    page: int
    page_size: int
    total: int


class RequirementUpdate(BaseModel):
    text: constr(strip_whitespace=True, min_length=1, max_length=10000)
    expected_revision: int = Field(..., ge=1)


class RequirementCreate(BaseModel):
    text: constr(strip_whitespace=True, min_length=1, max_length=10000)
    location: Optional[dict] = None

    @validator('location')
    def location_must_be_object(cls, value):
        if value is not None and not isinstance(value, dict):
            raise ValueError('location must be an object')
        return value


class AnalysisCreate(BaseModel):
    expected_input_hash: constr(min_length=64, max_length=64)

    @validator('expected_input_hash')
    def input_hash_must_be_sha256(cls, value):
        if re.fullmatch(r'[a-f0-9]{64}', value) is None:
            raise ValueError('expected_input_hash must be a lowercase SHA-256 digest')
        return value


class ReviewDecision(str, Enum):
    accept = 'accept'
    dismiss = 'dismiss'
    correct = 'correct'


class FindingReviewCreate(BaseModel):
    decision: ReviewDecision
    comment: constr(max_length=2000) = ''
    corrected_text: Optional[constr(strip_whitespace=True, min_length=1, max_length=10000)] = None
    corrected_label: Optional[constr(strip_whitespace=True, min_length=1, max_length=100)] = None

    @root_validator(skip_on_failure=True)
    def correction_value_required(cls, values):
        if values.get('decision') == 'correct' and not (
            values.get('corrected_text') or values.get('corrected_label')
        ):
            raise ValueError('Provide corrected_text or corrected_label for a correction decision')
        return values


class RequirementDelete(BaseModel):
    expected_revision: int = Field(..., ge=1)


class RequirementSplit(BaseModel):
    expected_revision: int = Field(..., ge=1)
    texts: list

    @validator('texts')
    def split_has_bounded_nonempty_parts(cls, value):
        if not isinstance(value, list) or not 2 <= len(value) <= 10:
            raise ValueError('Split into between 2 and 10 requirement statements')
        if any(not isinstance(text, str) or not text.strip() or len(text) > 10000 for text in value):
            raise ValueError('Each split statement must contain 1 to 10,000 characters')
        return [text.strip() for text in value]

    @root_validator(skip_on_failure=True)
    def split_size_is_bounded(cls, values):
        if sum(len(text) for text in values.get('texts', [])) > 10000:
            raise ValueError('Combined split text may not exceed 10,000 characters')
        return values


class RequirementMerge(BaseModel):
    other_requirement_id: constr(min_length=1)
    expected_revision: int = Field(..., ge=1)
    other_expected_revision: int = Field(..., ge=1)
