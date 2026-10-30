
package com.college.complaint_system.dto;

import com.college.complaint_system.entity.Complaint;
import com.college.complaint_system.entity.ComplaintCategory;
import com.college.complaint_system.entity.ComplaintStatus;
import com.college.complaint_system.entity.Priority;

import java.time.LocalDateTime;

public record ComplaintResponse(
        Long id,
        String title,
        String description,
        ComplaintCategory category,
        Priority priority,
        ComplaintStatus status,
        String departmentName,
        String departmentCode,
        String assignedToName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String classificationSource,
    String classificationReason,
    boolean manualReviewRequired
    ) {
    public static ComplaintResponse from(Complaint complaint) {
        return new ComplaintResponse(
                complaint.getId(),
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getCategory(),
                complaint.getPriority(),
                complaint.getStatus(),
                complaint.getDepartment() != null
                        ? complaint.getDepartment().getName() : null,
                complaint.getDepartment() != null
                        ? complaint.getDepartment().getCode() : null,
                complaint.getAssignedTo() != null
                        ? complaint.getAssignedTo().getName() : null,
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                complaint.getClassificationSource(),
                complaint.getClassificationReason(),
                complaint.isManualReviewRequired()
        );
    }
}
