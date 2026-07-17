package com.printhub3.backend.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * SlugUtil — Tiện ích chuyển văn bản bất kỳ (kể cả dấu tiếng Việt) thành slug thân thiện
 * với URL, ví dụ "Sạp của Tân" → "sap-cua-tan".
 */
public final class SlugUtil {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");
    private static final Pattern EDGE_DASHES = Pattern.compile("(^-+)|(-+$)");

    private SlugUtil() {
    }

    /** Chuyển chuỗi thành slug: bỏ dấu, thay khoảng trắng bằng '-', về chữ thường; rỗng → "shop". */
    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "shop";
        }
        String noWhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        // Map Đ/đ which Normalizer does not decompose
        noWhitespace = noWhitespace.replace("Đ", "D").replace("đ", "d");
        String normalized = Normalizer.normalize(noWhitespace, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String slug = NON_LATIN.matcher(normalized).replaceAll("");
        slug = EDGE_DASHES.matcher(slug).replaceAll("");
        slug = slug.toLowerCase(Locale.ENGLISH);
        return slug.isBlank() ? "shop" : slug;
    }
}
