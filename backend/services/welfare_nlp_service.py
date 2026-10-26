import re
from typing import Dict, Any, List, Optional
from sajag_models import (
    WelfareNLPResult, GrievanceCategory, GrievanceUrgency
)

class WelfareNLPService:
    """
    SAJAG Local Welfare & Grievance NLP Service.
    
    PRIVACY-BY-DESIGN & NON-DIAGNOSTIC:
    - Runs completely offline / locally.
    - NEVER classifies clinical psychiatric disorders (PTSD, depression, suicide).
    - Extracts operational welfare categories and urgency indicators for human officer review.
    """

    # Keyword taxonomies for robust local classification
    CATEGORY_PATTERNS = {
        GrievanceCategory.LEAVE: [
            r"\bleave\b", r"\bchhutti\b", r"\bsanction\b", r"\bemergency leave\b",
            r"\bdenied leave\b", r"\bpostponed\b", r"\bhome\b", r"\bvisiting family\b"
        ],
        GrievanceCategory.HOUSING: [
            r"\bbarrack\b", r"\bquarter\b", r"\baccommodation\b", r"\bwater leak\b",
            r"\belectricity\b", r"\bheating\b", r"\broom\b", r"\bhousing\b", r"\bliving condition\b"
        ],
        GrievanceCategory.FAMILY_SUPPORT: [
            r"\bfamily\b", r"\bmother\b", r"\bfather\b", r"\bchild\b", r"\bchildren\b",
            r"\bwife\b", r"\bhusband\b", r"\bparent\b", r"\bsick parent\b", r"\bschool\b",
            r"\bmedical emergency at home\b", r"\bdomestic\b"
        ],
        GrievanceCategory.WORKLOAD: [
            r"\bcontinuous duty\b", r"\b16 hours\b", r"\bdouble shift\b", r"\bno rest\b",
            r"\boverworked\b", r"\bexhausted\b", r"\bpatrol duty\b", r"\bnight shift\b"
        ],
        GrievanceCategory.ADMINISTRATIVE: [
            r"\bpay\b", r"\bsalary\b", r"\ballowance\b", r"\bda\b", r"\bpension\b",
            r"\btransfer\b", r"\bposting\b", r"\bclerical\b", r"\bdocumentation\b"
        ],
        GrievanceCategory.FACILITIES: [
            r"\bmess\b", r"\bfood\b", r"\bration\b", r"\bdrinking water\b", r"\bcanteen\b",
            r"\bheating\b", r"\bsanitation\b", r"\btoilet\b"
        ],
        GrievanceCategory.MEDICAL: [
            r"\bdoctor\b", r"\bmedicine\b", r"\bdispensary\b", r"\bhospital\b",
            r"\binjury\b", r"\bphysical pain\b", r"\bcheckup\b"
        ]
    }

    HIGH_DISTRESS_PATTERNS = [
        r"\bunbearable\b", r"\bcan\'?t take it\b", r"\bdesperate\b", r"\bcrying\b",
        r"\bhelpless\b", r"\bextreme stress\b", r"\bpanic\b", r"\burgent help\b",
        r"\bcritical\b", r"\bbreakdown\b"
    ]

    URGENT_INDICATORS = [
        r"\bimmediate\b", r"\bemergency\b", r"\basap\b", r"\bcritical\b",
        r"\bright away\b", r"\blife-threatening\b"
    ]

    @classmethod
    def analyze_welfare_text(cls, text: str, user_category: Optional[GrievanceCategory] = None) -> WelfareNLPResult:
        if not text or not text.strip():
            return WelfareNLPResult(
                detected_category=user_category or GrievanceCategory.OTHER,
                urgency=GrievanceUrgency.LOW,
                distress_indicator="Normal",
                keywords=[],
                summary="Empty or minimal welfare text provided.",
                requires_human_review=False,
                confidence=0.5
            )

        clean_text = text.lower()
        extracted_keywords = []

        # 1. Categorization Scoring
        scores: Dict[GrievanceCategory, int] = {}
        for cat, patterns in cls.CATEGORY_PATTERNS.items():
            count = 0
            for pattern in patterns:
                matches = re.findall(pattern, clean_text)
                if matches:
                    count += len(matches)
                    extracted_keywords.extend(matches)
            scores[cat] = count

        detected_category = max(scores, key=scores.get) if any(scores.values()) else (user_category or GrievanceCategory.OTHER)

        # 2. Urgency & Distress Analysis
        distress_count = 0
        for pat in cls.HIGH_DISTRESS_PATTERNS:
            matches = re.findall(pat, clean_text)
            if matches:
                distress_count += len(matches)
                extracted_keywords.extend(matches)

        urgent_count = 0
        for pat in cls.URGENT_INDICATORS:
            matches = re.findall(pat, clean_text)
            if matches:
                urgent_count += len(matches)
                extracted_keywords.extend(matches)

        # Non-diagnostic indicators
        if distress_count >= 2 or urgent_count >= 2:
            distress_indicator = "High Distress Language"
            urgency = GrievanceUrgency.URGENT
            requires_human_review = True
        elif distress_count >= 1 or urgent_count >= 1:
            distress_indicator = "Urgent Welfare Concern"
            urgency = GrievanceUrgency.HIGH
            requires_human_review = True
        elif len(text.split()) > 25:
            distress_indicator = "Detailed Welfare Context"
            urgency = GrievanceUrgency.MEDIUM
            requires_human_review = False
        else:
            distress_indicator = "Normal"
            urgency = GrievanceUrgency.LOW
            requires_human_review = False

        # 3. Explainable Summary Formulation
        unique_keywords = list(dict.fromkeys(extracted_keywords))[:5]
        summary = (
            f"Welfare concern relating to '{detected_category.value}'. "
            f"Key topic indicators: {', '.join(unique_keywords) if unique_keywords else 'general inquiry'}. "
            f"Sentiment signal: {distress_indicator}."
        )

        return WelfareNLPResult(
            detected_category=detected_category,
            urgency=urgency,
            distress_indicator=distress_indicator,
            keywords=unique_keywords,
            summary=summary,
            requires_human_review=requires_human_review,
            confidence=0.88 if unique_keywords else 0.70
        )
