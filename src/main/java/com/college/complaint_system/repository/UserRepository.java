package com.college.complaint_system.repository;

import com.college.complaint_system.entity.User;
import com.college.complaint_system.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByDepartment_IdAndRole(Long departmentId, UserRole role);

    List<User> findByRole(UserRole role);
}