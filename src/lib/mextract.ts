import { pipeline } from '@xenova/transformers';

export const mextract = pipeline(
    'feature-extraction',
    'all-MiniLM-L6-v2');