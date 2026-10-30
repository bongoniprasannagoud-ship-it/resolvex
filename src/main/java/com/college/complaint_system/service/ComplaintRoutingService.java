
package com.college.complaint_system.service;

import com.college.complaint_system.entity.ComplaintCategory;
import com.college.complaint_system.entity.Department;
import com.college.complaint_system.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

@Service
public class ComplaintRoutingService {

    private final DepartmentRepository departmentRepository;

    public ComplaintRoutingService(
            DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public Department determineDepartment(
            ComplaintCategory category) {

        String departmentCode = switch (category) {
            case IT -> "IT";
            case HOSTEL -> "HOSTEL";
            case ACADEMIC -> "ACADEMIC";
            case INFRASTRUCTURE, SAFETY -> "INFRA";
            case TRANSPORT -> "TRANSPORT";
            case CLEANLINESS -> "INFRA";
            case OTHER -> throw new IllegalArgumentException(
                    "Cannot automatically route an OTHER complaint. "
                            + "Manual review is required.");
        };

        return departmentRepository.findAll()
                .stream()
                .filter(department ->
                        departmentCode.equals(department.getCode()))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "Department not found: " + departmentCode));
    }
}
