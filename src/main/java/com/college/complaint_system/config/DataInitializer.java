package com.college.complaint_system.config;

import com.college.complaint_system.entity.Department;
import com.college.complaint_system.entity.User;
import com.college.complaint_system.entity.UserRole;
import com.college.complaint_system.repository.DepartmentRepository;
import com.college.complaint_system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initializeData(
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            // Create departments
            if (departmentRepository.count() == 0) {

                createDepartment(
                        departmentRepository,
                        "Information Technology",
                        "IT"
                );

                createDepartment(
                        departmentRepository,
                        "Hostel Administration",
                        "HOSTEL"
                );

                createDepartment(
                        departmentRepository,
                        "Academic Affairs",
                        "ACADEMIC"
                );

                createDepartment(
                        departmentRepository,
                        "Infrastructure",
                        "INFRA"
                );

                createDepartment(
                        departmentRepository,
                        "Transport",
                        "TRANSPORT"
                );
            }

            // Create test student if not already present
            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "Test Student",
                    "student@college.com",
                    "student123",
                    UserRole.STUDENT
            );

            // Create test staff if not already present
              // Create staff accounts and assign departments
                createStaffForDepartment(
                        departmentRepository, userRepository, passwordEncoder,
                        "Test Staff", "it.staff@college.com", "staff123", "IT"
                );

                createStaffForDepartment(
                departmentRepository, userRepository, passwordEncoder,
                "IT Staff 2", "it.staff2@college.com", "staff123", "IT"
                );

                createStaffForDepartment(
                        departmentRepository, userRepository, passwordEncoder,
                        "Hostel Staff", "hostel.staff@college.com", "staff123", "HOSTEL"
                );

                createStaffForDepartment(
                        departmentRepository, userRepository, passwordEncoder,
                        "Academic Staff", "academic.staff@college.com", "staff123", "ACADEMIC"
                );

                createStaffForDepartment(
                        departmentRepository, userRepository, passwordEncoder,
                        "Infrastructure Staff", "infra.staff@college.com", "staff123", "INFRA"
                );

                createStaffForDepartment(
                        departmentRepository, userRepository, passwordEncoder,
                        "Transport Staff", "transport.staff@college.com", "staff123", "TRANSPORT"
                );

                // Assign staff to IT department
                User staff = userRepository.findByEmail("it.staff@college.com")
                        .orElseThrow();

                Department itDepartment = departmentRepository.findByCode("IT")
                .orElseThrow(() ->
                        new IllegalStateException("IT department not found in database"));

                if (staff.getDepartment() == null) {
                staff.setDepartment(itDepartment);
                userRepository.save(staff);
}
            // Create admin if not already present
            createUserIfNotExists(
                    userRepository,
                    passwordEncoder,
                    "System Admin",
                    "admin@college.com",
                    "admin123",
                    UserRole.ADMIN
            );
        };
    }

    private void createUserIfNotExists(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String name,
            String email,
            String password,
            UserRole role) {

        if (userRepository.findByEmail(email).isEmpty()) {

            User user = new User();

            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role);
            user.setCreatedAt(LocalDateTime.now());

            userRepository.save(user);
        }
    }

        private void createStaffForDepartment(
                DepartmentRepository departmentRepository,
                UserRepository userRepository,
                PasswordEncoder passwordEncoder,
                String name,
                String email,
                String password,
                String departmentCode) {

        createUserIfNotExists(
                userRepository,
                passwordEncoder,
                name,
                email,
                password,
                UserRole.STAFF
        );

        User staff = userRepository.findByEmail(email)
                .orElseThrow();

        Department department = departmentRepository
                .findByCode(departmentCode)
                .orElseThrow(() -> new IllegalStateException(
                        "Department not found: " + departmentCode));

        if (staff.getDepartment() == null) {
                staff.setDepartment(department);
                userRepository.save(staff);
        }
        }

    private void createDepartment(
            DepartmentRepository repository,
            String name,
            String code) {

        Department department = new Department();

        department.setName(name);
        department.setCode(code);

        repository.save(department);
    }
}
