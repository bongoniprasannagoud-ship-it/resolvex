package com.college.complaint_system.service;

import com.college.complaint_system.dto.CreateStaffRequest;
import com.college.complaint_system.dto.DepartmentOptionResponse;
import com.college.complaint_system.dto.StaffOptionResponse;
import com.college.complaint_system.dto.UpdateStaffRequest;
import com.college.complaint_system.entity.Department;
import com.college.complaint_system.entity.User;
import com.college.complaint_system.entity.UserRole;
import com.college.complaint_system.repository.DepartmentRepository;
import com.college.complaint_system.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminManagementService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminManagementService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<StaffOptionResponse> getAllStaff() {

        return userRepository.findByRole(UserRole.STAFF)
                .stream()
                .map(StaffOptionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DepartmentOptionResponse> getAllDepartments() {

        return departmentRepository.findAll()
                .stream()
                .map(DepartmentOptionResponse::from)
                .toList();
    }

@Transactional
public StaffOptionResponse createStaff(CreateStaffRequest request) {

    String email = request.email().trim().toLowerCase();

    if (userRepository.findByEmail(email).isPresent()) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists."
        );
    }

    Department department = getDepartment(request.departmentId());

    User staff = new User();

    staff.setName(request.name().trim());
    staff.setEmail(email);
    staff.setPassword(passwordEncoder.encode(request.password()));
    staff.setRole(UserRole.STAFF);
    staff.setDepartment(department);
    staff.setCreatedAt(LocalDateTime.now());

    User savedStaff = userRepository.save(staff);

    return StaffOptionResponse.from(savedStaff);
}

   @Transactional
public StaffOptionResponse updateStaff(
        Long staffId,
        UpdateStaffRequest request) {

    User staff = userRepository.findById(staffId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Staff account not found."
            ));

    if (staff.getRole() != UserRole.STAFF) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only staff accounts can be updated through this endpoint."
        );
    }

    Department department = getDepartment(request.departmentId());

    staff.setName(request.name().trim());
    staff.setDepartment(department);

    User updatedStaff = userRepository.save(staff);

    return StaffOptionResponse.from(updatedStaff);
}

    private Department getDepartment(Long departmentId) {

        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Department not found."
                ));
    }
}