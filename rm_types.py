import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

types_start = content.find('// ==========================================')
after_types = content.find('// ==========================================\n// RATING COLOR HELPERS')

if types_start != -1 and after_types != -1:
    before = content[:types_start]
    after = content[after_types:]
    
    # insert the imports
    imports = """import { Institution, Professor, InstitutionReview, ProfessorReview, Suggestion } from './types'
import { VIETNAM_PROVINCES, PROF_TAGS, CRITERIA_KEYS, GRADE_OPTIONS } from './constants'
"""
    new_content = before + imports + after
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
