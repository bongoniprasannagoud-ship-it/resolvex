
package com.college.complaint_system.dto;

import com.college.complaint_system.entity.ComplaintHistory;
import com.college.complaint_system.entity.ComplaintStatus;

import java.time.LocalDateTime;

public record ComplaintHistoryResponse(
        Long id,
        ComplaintStatus status,
        String action,
        String message,
        LocalDateTime createdAt
) {
    public static ComplaintHistoryResponse from(
            ComplaintHistory history) {

        return new ComplaintHistoryResponse(
                history.getId(),
                history.getStatus(),
                history.getAction(),
                history.getMessage(),
                history.getCreatedAt()
        );
    }
}
