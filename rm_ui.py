import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('// ==========================================\n// RATING COLOR HELPERS')
end_idx = content.find('// ==========================================\n// MAIN APP')

if start_idx != -1 and end_idx != -1:
    ui_content = content[start_idx:end_idx]
    
    # We need to extract the UI components into src/components/ui/UIComponents.tsx
    # We will need imports for these UI components in UIComponents.tsx
    ui_file_content = """import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Institution, Professor, InstitutionReview, ProfessorReview, Suggestion } from '../../types';
import { VIETNAM_PROVINCES, PROF_TAGS, CRITERIA_KEYS, GRADE_OPTIONS } from '../../constants';
""" + ui_content + """
export {
  ratingSelectedClass,
  barColorClass,
  Button,
  ButtonGroup,
  LiquidModal,
  SearchableDropdown,
  Badge,
  ScoreBadge,
  RatingSelector,
  VoteFooter
};
"""
    with open('src/components/ui/UIComponents.tsx', 'w') as f:
        f.write(ui_file_content)
    
    # Now replace them in App.tsx
    before = content[:start_idx]
    after = content[end_idx:]
    imports = """import {
  ratingSelectedClass,
  barColorClass,
  Button,
  ButtonGroup,
  LiquidModal,
  SearchableDropdown,
  Badge,
  ScoreBadge,
  RatingSelector,
  VoteFooter
} from './components/ui/UIComponents';
"""
    new_content = before + imports + after
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
