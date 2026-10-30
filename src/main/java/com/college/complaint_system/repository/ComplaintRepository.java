
package com.college.complaint_system.repository;

import com.college.complaint_system.entity.Complaint;
import com.college.complaint_system.entity.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByUserEmail(String email);

    List<Complaint> findByManualReviewRequiredTrue();

    long countByAssignedToIdAndStatusIn(
            Long staffId,
            List<ComplaintStatus> statuses
    );
    List<Complaint> findByAssignedToIsNullAndDepartmentIsNotNullAndManualReviewRequiredFalse();
    List<Complaint> findByAssignedToEmail(String email);
}

