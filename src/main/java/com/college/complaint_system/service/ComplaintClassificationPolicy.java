
package com.college.complaint_system.service;

import com.college.complaint_system.entity.ComplaintCategory;
import com.college.complaint_system.entity.Priority;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class ComplaintClassificationPolicy {

    public ComplaintClassificationService.Classification apply(
            String title,
            String description,
            ComplaintCategory category,
            Priority priority,
            String source,
            String reason) {

        String text = (title + " " + description)
                .toLowerCase(Locale.ROOT);

        boolean safetyCritical = containsAny(
                text,
                "fire",
                "gas leak",
                "electric shock",
                "exposed live wire",
                "electrical wire",
                "life threatening",
                "severe injury",
                "smoke in the building"
        );

        boolean manualReviewRequired =
                safetyCritical
                || category == ComplaintCategory.OTHER
                || "KEYWORD_FALLBACK".equals(source);

        if (safetyCritical) {
            priority = Priority.HIGH;
            reason = "Potential safety hazard detected; urgent review is required.";

            // Determine the relevant category from the hazard context.
            if (containsAny(text, "bus", "college vehicle",
                    "vehicle fire", "driver")) {
                category = ComplaintCategory.TRANSPORT;
            } else if (containsAny(text, "hostel", "dormitory")) {
                category = ComplaintCategory.HOSTEL;
            } else if (containsAny(text,
                    "wire", "electricity", "electrical",
                    "electric shock", "gas leak", "fire",
                    "smoke in the building", "plumbing",
                    "water leakage", "washroom")) {
                category = ComplaintCategory.INFRASTRUCTURE;
            }
        }

        if (reason == null || reason.isBlank()) {
            reason = "Classification determined from the complaint details.";
        }

        return new ComplaintClassificationService.Classification(
                category,
                priority,
                source,
                reason,
                manualReviewRequired
        );
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
