package com.college.complaint_system.dto;

import com.college.complaint_system.entity.ComplaintStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateComplaintStatusRequest {

    @NotNull
    private ComplaintStatus status;

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }
}