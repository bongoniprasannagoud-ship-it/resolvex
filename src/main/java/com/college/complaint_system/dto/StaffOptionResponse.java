package com.college.complaint_system.dto;

import com.college.complaint_system.entity.User;

public record StaffOptionResponse(
        Long id,
        String name,
        String email,
        Long departmentId,
        String departmentName,
        String departmentCode
) {
    public static StaffOptionResponse from(User user) {
        return new StaffOptionResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getDepartment() != null
                        ? user.getDepartment().getId()
                        : null,
                user.getDepartment() != null
                        ? user.getDepartment().getName()
                        : null,
                user.getDepartment() != null
                        ? user.getDepartment().getCode()
                        : null
        );
    }
}