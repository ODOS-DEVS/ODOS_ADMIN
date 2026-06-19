#!/usr/bin/env python3
"""Add dossier navigation buttons to full directory pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src" / "pages" / "full"

ROUTES = {
    "FullOrdersPage.tsx": ("order", "orders"),
    "FullVendorsPage.tsx": ("vendor", "vendors"),
    "FullVendorApplicationsPage.tsx": ("application", "vendor-applications"),
    "FullStoresPage.tsx": ("store", "stores"),
    "FullProductsPage.tsx": ("product", "products"),
    "FullPayoutsPage.tsx": ("payout", "payouts"),
    "FullReturnsPage.tsx": ("item", "returns"),
    "FullReviewsPage.tsx": ("review", "reviews"),
    "FullVouchersPage.tsx": ("voucher", "vouchers"),
}

def patch(path: Path, entity: str, section: str) -> None:
    text = path.read_text()
    if "useNavigate" not in text:
        text = text.replace(
            'import { useCallback, useEffect, useMemo, useState',
            'import { useCallback, useEffect, useMemo, useState',
        )
        if 'from "react-router-dom"' not in text:
            text = re.sub(
                r'(import \{ useCallback, useEffect, useMemo, useState[^}]*\} from "react";)',
                r'\1\nimport { useNavigate } from "react-router-dom";',
                text,
                count=1,
            )
    if "const navigate = useNavigate()" not in text:
        text = re.sub(
            r"(export function Full\w+\(\) \{\n  const \{ token \} = useAdminAuth\(\);)",
            r"\1\n  const navigate = useNavigate();",
            text,
            count=1,
        )
    dossier_btn = f'''                    <Button
                      variant="primary"
                      onClick={{() => navigate("/{section}/full/${{{entity}.id}}")}}
                    >
                      Open dossier
                    </Button>'''
    if "Open dossier" not in text and "Actions" in text:
        text = text.replace(
            '<div className="flex flex-wrap gap-2">',
            '<div className="flex flex-wrap gap-2">\n' + dossier_btn,
            1,
        )
    path.write_text(text)
    print(path.name)


def main() -> None:
    for fname, (entity, section) in ROUTES.items():
        p = ROOT / fname
        if p.exists():
            patch(p, entity, section)


if __name__ == "__main__":
    main()
