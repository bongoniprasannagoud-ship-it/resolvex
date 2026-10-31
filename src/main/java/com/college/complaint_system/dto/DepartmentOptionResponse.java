package com.college.complaint_system.dto;

import com.college.complaint_system.entity.Department;

public record DepartmentOptionResponse(
        Long id,
        String name,
        String code
) {
    public static DepartmentOptionResponse from(Department department) {
        return new DepartmentOptionResponse(
                department.getId(),
                department.getName(),
                department.getCode()
        );
    }
}