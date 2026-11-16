import re
import unicodedata
from typing import Optional, List

def remove_accents(text: Optional[str]) -> str:
    """
    Normalizes string by removing accents and diacritics, lowercase.
    e.g. 'Martín Rodríguez' -> 'martin rodriguez'
    """
    if not text:
        return ""
    return "".join(
        c for c in unicodedata.normalize("NFKD", text)
        if unicodedata.category(c) != "Mn"
    ).lower().strip()

def normalize_phone(phone: Optional[str]) -> str:
    """
    Normalizes Argentine phone numbers to canonical 10 digits.
    Handles:
      - 3513146924
      - +5493513146924
      - +543513146924
      - 543513146924
      - 03513146924
      - +54 9 351 314-6924
      - 0351-15-3146924
    """
    if not phone:
        return ""
    # Extract only digits
    d = re.sub(r"\D", "", phone)
    if not d:
        return ""

    # Remove Argentina international code: +54 9 or +54
    if d.startswith("549") and len(d) >= 12:
        d = d[3:]
    elif d.startswith("54") and len(d) >= 11:
        d = d[2:]

    # Remove leading trunk dial '0' (e.g. 0351 -> 351, 011 -> 11)
    if d.startswith("0") and len(d) >= 10:
        d = d[1:]

    # Remove mobile '15' prefix inside national number if present
    if len(d) > 10:
        # 2-digit area code (e.g. 11 15 xxxxxxxx)
        if d[:2] == "11" and d[2:4] == "15":
            d = "11" + d[4:]
        # 3-digit area code (e.g. 351 15 xxxxxxx, 341 15 xxxxxxx)
        elif len(d) == 12 and d[3:5] == "15":
            d = d[:3] + d[5:]
        # 4-digit area code (e.g. 2966 15 xxxxxx)
        elif len(d) == 13 and d[4:6] == "15":
            d = d[:4] + d[6:]

    # Remove dangling mobile 9 if still 11 digits
    if len(d) == 11 and d.startswith("9"):
        d = d[1:]

    # If still longer than 10 digits, the last 10 digits represent the canonical national number
    if len(d) > 10:
        d = d[-10:]

    return d

def get_customer_phone_forms(cust_phone: Optional[str]) -> List[str]:
    """
    Returns all valid dialing representations for a stored customer phone
    (e.g. '1144332211', '01144332211', '541144332211', '5491144332211').
    """
    if not cust_phone:
        return []
    raw = re.sub(r"\D", "", cust_phone)
    norm = normalize_phone(cust_phone)
    forms = {raw}
    if norm:
        forms.add(norm)
        forms.add("0" + norm)
        forms.add("54" + norm)
        forms.add("549" + norm)
        forms.add("9" + norm)
    return [f for f in forms if f]

def get_query_phone_variants(query: Optional[str]) -> List[str]:
    """
    Extracts core phone digit possibilities while the user is typing progressively
    (e.g. '+54911' -> ['54911', '11'], '0114' -> ['0114', '114'], '5411' -> ['5411', '11']).
    """
    if not query:
        return []
    q_digits = re.sub(r"\D", "", query)
    if not q_digits:
        return []
    variants = {q_digits}
    if q_digits.startswith("549"):
        variants.add(q_digits[3:])
    elif q_digits.startswith("54"):
        variants.add(q_digits[2:])
    if q_digits.startswith("0"):
        variants.add(q_digits[1:])
    if q_digits.startswith("9") and len(q_digits) > 1:
        variants.add(q_digits[1:])
    return [v for v in variants if v]

def phones_match(phone1: Optional[str], phone2: Optional[str]) -> bool:
    """
    Determines if two phone numbers refer to the same subscriber.
    """
    p1 = normalize_phone(phone1)
    p2 = normalize_phone(phone2)
    if not p1 or not p2:
        return False
    if p1 == p2:
        return True
    # Match if one is full 10-digit and the other is local subscriber part (7 or 8 digits)
    if len(p1) == 10 and len(p2) >= 7 and p1.endswith(p2):
        return True
    if len(p2) == 10 and len(p1) >= 7 and p2.endswith(p1):
        return True
    return False

def matches_customer_search(customer, query_str: str) -> bool:
    """
    Intelligent match supporting accent-insensitive names,
    partial word matching, and progressive multi-format phone numbers.
    """
    if not query_str:
        return True

    q_clean = query_str.strip()
    q_norm = remove_accents(q_clean)
    q_digits = re.sub(r"\D", "", q_clean)

    # 1. Accent-insensitive Name Matching
    cust_name_norm = remove_accents(customer.full_name)
    if q_norm and q_norm in cust_name_norm:
        return True

    # Multi-word match: every word in query appears in customer name
    words = [w for w in q_norm.split() if len(w) > 0]
    if len(words) > 1 and all(w in cust_name_norm for w in words):
        return True

    # 2. Progressive Phone Matching (works with 1 digit, 2 digits, or any prefix: 0, 54, +549, etc.)
    if q_digits:
        q_variants = get_query_phone_variants(q_clean)
        cust_forms = get_customer_phone_forms(customer.phone)
        for qv in q_variants:
            for cf in cust_forms:
                if qv in cf:
                    return True

    # 3. DNI Matching
    if customer.dni and q_digits:
        cust_dni_digits = re.sub(r"\D", "", customer.dni)
        if q_digits in cust_dni_digits or cust_dni_digits in q_digits:
            return True

    return False
