export const DEFAULT_API_PARAMS = {
    blockUnfunded: false,
    testMode: true,
    language: 'en-US'
};

const jurisdictionMap: Record<string, string> = {
    'on': 'CA-ON',
    'pa': 'US-PA',
    'nj': 'US-NJ',
    'ri': 'US-RI'
};

export const BRAND_ID_MAP: Record<string, number> = {
    'ballybetnj': 139,
    'ballybetpa': 139,
    'ballybetri': 139,
    'ballybeton': 153,
    'monopolycasinonj': 151,
    'monopolycasinopa': 151,
    'monopolycasinoon': 163,
};

export function setWhiteHatParams(ventureName: string) {
    const brandId = BRAND_ID_MAP[ventureName];
    const jurisdictionKey = Object.keys(jurisdictionMap).find((key) => ventureName.slice(-2) === key);

    const jurisdiction = jurisdictionKey ? jurisdictionMap[jurisdictionKey] : undefined;
    
    // Set country based on venture: 'CA' for Ontario ('on'), 'US' for everything else
    const country = jurisdictionKey === 'on' ? 'CA' : 'US';

    if (!brandId || !jurisdiction) {
        return null;
    };

    return {
        brandId,
        jurisdiction,
        country
    };
};
