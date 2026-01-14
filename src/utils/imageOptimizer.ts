import sharp from 'sharp';

/**
 * Resizes and compresses a Base64 image string.
 * Target: JPEG, 500px width, 80% quality.
 * @param base64String The full base64 string (including data:image/... prefix)
 * @returns Optimized base64 string
 */
export const optimizeBase64Image = async (base64String: string): Promise<string> => {
    try {
        if (!base64String || typeof base64String !== 'string') return base64String;

        // Check format
        const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);

        // If strict format matching fails, try simpler split if it contains comma
        // Some systems might send without mime type?
        let buffer: Buffer;

        if (matches && matches.length === 3) {
            buffer = Buffer.from(matches[2], 'base64');
        } else if (base64String.includes(',')) {
            // Fallback: split by comma
            const split = base64String.split(',');
            buffer = Buffer.from(split[1], 'base64');
        } else {
            // Maybe raw base64?
            // Attempt to parse, if fails return original
            try {
                buffer = Buffer.from(base64String, 'base64');
            } catch (e) {
                return base64String;
            }
        }

        // Check if buffer is valid image
        try {
            await sharp(buffer).metadata();
        } catch (e) {
            console.warn('Invalid image data for optimization, skipping.');
            return base64String;
        }

        const optimizedBuffer = await sharp(buffer)
            .resize({ width: 500, withoutEnlargement: true }) // Max width 500px
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();

        return `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;

    } catch (error) {
        console.error('Image optimization error:', error);
        return base64String; // Return original on error to be safe
    }
};
