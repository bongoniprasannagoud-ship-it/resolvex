package com.college.complaint_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateStaffRequest(

        @NotBlank
        @Size(max = 100)
        String name,

        @NotNull
        Long departmentId

) {
}