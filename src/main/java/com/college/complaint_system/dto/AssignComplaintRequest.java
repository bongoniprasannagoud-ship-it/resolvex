package com.college.complaint_system.dto;

import jakarta.validation.constraints.NotNull;

public class AssignComplaintRequest {

    @NotNull
    private Long staffId;

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }
}