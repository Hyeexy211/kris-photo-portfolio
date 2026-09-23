// Read common JPEG EXIF values locally before the selected file is exported to WebP.
// These values are suggestions only; Admin decides whether to copy and save them.
(function () {
    const emptyReview = () => ({
        date: "",
        captureTime: "",
        camera: "",
        lens: "",
        focalLength: "",
        aperture: "",
        shutterSpeed: "",
        iso: "",
        hasGps: false,
        status: "no-exif"
    });

    function formatDecimal(value) {
        return Number(value.toFixed(2)).toString();
    }

    function captureDateAndTime(value) {
        const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
        if (!match) return { date: "", captureTime: "" };

        const [, year, month, day, hour, minute, second] = match;
        const yearNumber = Number(year);
        const monthNumber = Number(month);
        const dayNumber = Number(day);
        const leapYear = yearNumber % 4 === 0 && (yearNumber % 100 !== 0 || yearNumber % 400 === 0);
        const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (yearNumber < 1 || monthNumber < 1 || monthNumber > 12
            || dayNumber < 1 || dayNumber > daysInMonth[monthNumber - 1]
            || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) {
            return { date: "", captureTime: "" };
        }
        return { date: `${year}-${month}-${day}`, captureTime: `${hour}:${minute}:${second}` };
    }

    function parseExif(view, start, end) {
        const review = emptyReview();
        const tiffStart = start + 6;
        if (tiffStart + 8 > end) throw new Error("Short TIFF header");

        const byteOrder = view.getUint16(tiffStart, false);
        if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) throw new Error("Invalid byte order");
        const littleEndian = byteOrder === 0x4949;
        const uint16 = (offset) => view.getUint16(offset, littleEndian);
        const uint32 = (offset) => view.getUint32(offset, littleEndian);
        if (uint16(tiffStart + 2) !== 42) throw new Error("Invalid TIFF marker");

        function checkedOffset(relativeOffset, byteCount) {
            const absoluteOffset = tiffStart + relativeOffset;
            if (!Number.isSafeInteger(byteCount) || relativeOffset < 0
                || absoluteOffset < tiffStart || absoluteOffset + byteCount > end) {
                throw new Error("EXIF value outside APP1 segment");
            }
            return absoluteOffset;
        }

        function readIfd(relativeOffset) {
            const offset = checkedOffset(relativeOffset, 2);
            const count = uint16(offset);
            checkedOffset(relativeOffset + 2, count * 12 + 4);
            const entries = new Map();
            for (let index = 0; index < count; index += 1) {
                const entryOffset = offset + 2 + index * 12;
                const tag = uint16(entryOffset);
                if (!entries.has(tag)) entries.set(tag, entryOffset);
            }
            return entries;
        }

        function valueOffset(entryOffset, expectedType, maxCount = 1024) {
            if (entryOffset === undefined || uint16(entryOffset + 2) !== expectedType) return null;
            const count = uint32(entryOffset + 4);
            const unitSize = expectedType === 5 ? 8 : expectedType === 3 ? 2 : expectedType === 4 ? 4 : 1;
            if (count < 1 || count > maxCount) return null;
            const byteCount = count * unitSize;
            const offset = byteCount <= 4 ? entryOffset + 8 : checkedOffset(uint32(entryOffset + 8), byteCount);
            return { offset, count };
        }

        function ascii(entries, tag) {
            const value = valueOffset(entries.get(tag), 2);
            if (!value) return "";
            const bytes = [];
            for (let index = 0; index < value.count; index += 1) {
                const byte = view.getUint8(value.offset + index);
                if (byte === 0) break;
                bytes.push(byte);
            }
            return String.fromCharCode(...bytes).trim();
        }

        function pointer(entries, tag) {
            const value = valueOffset(entries.get(tag), 4, 1);
            return value ? uint32(value.offset) : 0;
        }

        function rational(entries, tag) {
            const value = valueOffset(entries.get(tag), 5, 1);
            if (!value) return null;
            const numerator = uint32(value.offset);
            const denominator = uint32(value.offset + 4);
            return numerator > 0 && denominator > 0 ? { numerator, denominator } : null;
        }

        function iso(entries) {
            const entry = entries.get(0x8827);
            const short = valueOffset(entry, 3);
            const long = short ? null : valueOffset(entry, 4);
            const number = short ? uint16(short.offset) : long ? uint32(long.offset) : 0;
            return number > 0 ? String(number) : "";
        }

        const primary = readIfd(uint32(tiffStart + 4));
        const exifPointer = pointer(primary, 0x8769);
        const exif = exifPointer ? readIfd(exifPointer) : new Map();
        const gpsPointer = pointer(primary, 0x8825);
        if (gpsPointer) {
            // Validate the directory, but do not read or return any GPS values.
            review.hasGps = readIfd(gpsPointer).size > 0;
        }

        const capture = captureDateAndTime(ascii(exif, 0x9003));
        review.date = capture.date;
        review.captureTime = capture.captureTime;
        const make = ascii(primary, 0x010f);
        const model = ascii(primary, 0x0110);
        review.camera = make && model && model.toLowerCase().startsWith(make.toLowerCase())
            ? model : [make, model].filter(Boolean).join(" ");
        review.lens = ascii(exif, 0xa434);

        const focal = rational(exif, 0x920a);
        if (focal) review.focalLength = `${formatDecimal(focal.numerator / focal.denominator)} mm`;
        const aperture = rational(exif, 0x829d);
        if (aperture) review.aperture = `f/${formatDecimal(aperture.numerator / aperture.denominator)}`;
        const shutter = rational(exif, 0x829a);
        if (shutter) {
            const { numerator, denominator } = shutter;
            if (numerator >= denominator) {
                review.shutterSpeed = `${formatDecimal(numerator / denominator)} s`;
            } else {
                let first = numerator;
                let second = denominator;
                while (second) [first, second] = [second, first % second];
                review.shutterSpeed = `${numerator / first}/${denominator / first} s`;
            }
        }
        review.iso = iso(exif);
        review.status = "ok";
        return review;
    }

    async function reviewJpegExif(file) {
        const review = emptyReview();
        if (!file || typeof file.arrayBuffer !== "function") {
            return { ...review, status: "unsupported" };
        }

        let view;
        try {
            view = new DataView(await file.arrayBuffer());
        } catch {
            return { ...review, status: "invalid-exif" };
        }
        if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) {
            return { ...review, status: "unsupported" };
        }

        let offset = 2;
        try {
            while (offset < view.byteLength) {
                if (view.getUint8(offset) !== 0xff) throw new Error("Invalid JPEG marker");
                while (offset < view.byteLength && view.getUint8(offset) === 0xff) offset += 1;
                if (offset >= view.byteLength) throw new Error("Missing JPEG marker");
                const marker = view.getUint8(offset);
                offset += 1;
                if (marker === 0xd9 || marker === 0xda) return review;
                if (marker === 0x00) throw new Error("Invalid JPEG marker");
                if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
                if (offset + 2 > view.byteLength) throw new Error("Short JPEG segment");
                const segmentLength = view.getUint16(offset, false);
                if (segmentLength < 2 || offset + segmentLength > view.byteLength) {
                    throw new Error("Invalid JPEG segment length");
                }
                const start = offset + 2;
                const end = offset + segmentLength;
                if (marker === 0xe1 && end - start >= 6
                    && view.getUint32(start, false) === 0x45786966
                    && view.getUint16(start + 4, false) === 0) {
                    return parseExif(view, start, end);
                }
                offset = end;
            }
            throw new Error("Incomplete JPEG");
        } catch {
            return { ...review, status: "invalid-exif" };
        }
    }

    window.reviewJpegExif = reviewJpegExif;
}());
