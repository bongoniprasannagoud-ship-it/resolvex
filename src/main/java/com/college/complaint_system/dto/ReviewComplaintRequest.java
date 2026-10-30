
package com.college.complaint_system.dto;

import com.college.complaint_system.entity.ComplaintCategory;
import com.college.complaint_system.entity.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReviewComplaintRequest(

        @NotNull
        ComplaintCategory category,

        @NotNull
        Priority priority,

        @NotBlank
        String reason

) {
}
