package com.college.complaint_system.service;

import com.college.complaint_system.repository.UserRepository;
import com.college.complaint_system.dto.CreateComplaintRequest;
import com.college.complaint_system.entity.*;
import com.college.complaint_system.repository.ComplaintRepository;
import com.college.complaint_system.repository.ComplaintHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.college.complaint_system.service.ComplaintClassificationService;
import com.college.complaint_system.dto.ComplaintHistoryResponse;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final ComplaintRoutingService routingService;
    private final ComplaintHistoryRepository historyRepository;
    private final ComplaintClassificationService classificationService;
    private final ComplaintLifecycleService lifecycleService;
    

        public List<Complaint> getMyComplaints(String email) {

        return complaintRepository
                .findByUserEmail(email);
        }

    public ComplaintService(
            ComplaintRepository complaintRepository,
            UserRepository userRepository,
            ComplaintRoutingService routingService,
            ComplaintHistoryRepository historyRepository,
            ComplaintClassificationService classificationService,
            ComplaintLifecycleService lifecycleService) {

        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.routingService = routingService;
        this.historyRepository = historyRepository;
        this.classificationService=classificationService;
        this.lifecycleService=lifecycleService;
    }


        @Transactional
        public Complaint createComplaint(
                CreateComplaintRequest request,
                String email) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        ComplaintClassificationService.Classification result =
                classificationService.classifyComplaint(
                        request.getTitle(),
                        request.getDescription());

        ComplaintCategory category = result.category();
        Priority priority = result.priority();



        Department department = null;

        if (category != ComplaintCategory.OTHER) {
        department = routingService.determineDepartment(category);
        }

        Complaint complaint = new Complaint();

        boolean requiresManualReview =
                result.manualReviewRequired()
                || category == ComplaintCategory.OTHER;

        complaint.setManualReviewRequired(requiresManualReview);

        complaint.setCategory(category);
        complaint.setPriority(priority);
        complaint.setDepartment(department);
       complaint.setStatus(
                requiresManualReview
                        ? ComplaintStatus.PENDING_REVIEW
                        : ComplaintStatus.ROUTED
        );
        //complaint.setPriority(Priority.MEDIUM);

        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());

        complaint.setUser(user);

        complaint.setClassificationSource(result.source());
        complaint.setClassificationReason(result.reason());

        

        

        LocalDateTime now = LocalDateTime.now();

        complaint.setCreatedAt(now);
        complaint.setUpdatedAt(now);

        Complaint savedComplaint =
                complaintRepository.save(complaint);

        ComplaintHistory history =
                new ComplaintHistory();

        history.setComplaint(savedComplaint);
        history.setStatus(savedComplaint.getStatus());
        history.setAction("COMPLAINT_CREATED");
        String historyMessage;

        if (savedComplaint.getDepartment() == null) {
        historyMessage =
                "Complaint created and sent for manual review "
                        + "because no department was assigned automatically.";
        } else {
        historyMessage =
                "Complaint created and routed to "
                        + savedComplaint.getDepartment().getName();
        }

        history.setMessage(historyMessage);
                history.setCreatedAt(LocalDateTime.now());

        historyRepository.save(history);

if (!requiresManualReview && department != null) {
    savedComplaint = autoAssignComplaint(savedComplaint);
}

return savedComplaint;



        //return complaintRepository.save(complaint);
    }
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    @Transactional(readOnly = true)
public List<Complaint> getManualReviewComplaints() {
    return complaintRepository.findByManualReviewRequiredTrue();
}

public List<Complaint> getUnassignedComplaints() {
    return complaintRepository
            .findByAssignedToIsNullAndDepartmentIsNotNullAndManualReviewRequiredFalse();
}

@Transactional
public Complaint reviewComplaint(
        Long complaintId,
        ComplaintCategory category,
        Priority priority,
        String reason) {

    Complaint complaint = complaintRepository.findById(complaintId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Complaint not found: " + complaintId));

    if (!complaint.isManualReviewRequired()) {
        throw new IllegalStateException(
                "This complaint does not require manual review");
    }

    if (category == ComplaintCategory.OTHER) {
        throw new IllegalArgumentException(
                "Select a specific category so the complaint can be routed");
    }

    Department department =
            routingService.determineDepartment(category);

    complaint.setCategory(category);
    complaint.setPriority(priority);
    complaint.setDepartment(department);
    complaint.setStatus(ComplaintStatus.ROUTED);
    complaint.setClassificationSource("ADMIN_REVIEW");
    complaint.setClassificationReason(reason.trim());
    complaint.setManualReviewRequired(false);

    LocalDateTime now = LocalDateTime.now();
    complaint.setUpdatedAt(now);

    Complaint saved = complaintRepository.save(complaint);

    ComplaintHistory history = new ComplaintHistory();
    history.setComplaint(saved);
    history.setStatus(saved.getStatus());
    history.setAction("COMPLAINT_REVIEWED");
    history.setMessage(
            "Admin reviewed classification. Category: "
                    + category
                    + ", priority: "
                    + priority
                    + ". Reason: "
                    + reason.trim());
    history.setCreatedAt(now);

    historyRepository.save(history);

    return autoAssignComplaint(saved);
}

    public Complaint getComplaint(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Complaint not found: " + id));
    }
    
@Transactional(readOnly = true)
public List<ComplaintHistoryResponse> getComplaintHistory(
        Long complaintId,
        String email,
        String role) {

    Complaint complaint = getComplaint(complaintId);

    boolean isAdmin = "ROLE_ADMIN".equals(role);

    boolean isOwner = complaint.getUser() != null
            && email.equals(complaint.getUser().getEmail());

    boolean isAssignedStaff = complaint.getAssignedTo() != null
            && email.equals(complaint.getAssignedTo().getEmail());

    boolean allowed = isAdmin
            || ("ROLE_STUDENT".equals(role) && isOwner)
            || ("ROLE_STAFF".equals(role) && isAssignedStaff);

    if (!allowed) {
        throw new org.springframework.security.access.AccessDeniedException(
                "You are not allowed to view this complaint history."
        );
    }

    return historyRepository
            .findByComplaintIdOrderByCreatedAtAsc(complaintId)
            .stream()
            .map(ComplaintHistoryResponse::from)
            .toList();
}


private Complaint autoAssignComplaint(Complaint complaint) {

    if (complaint.getDepartment() == null) {
        return complaint;
    }

    List<User> eligibleStaff =
            userRepository.findByDepartment_IdAndRole(
                    complaint.getDepartment().getId(),
                    UserRole.STAFF
            );

    if (eligibleStaff.isEmpty()) {
        return complaint;
    }

    List<ComplaintStatus> activeStatuses = List.of(
            ComplaintStatus.ASSIGNED,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.REOPENED
    );

    User selectedStaff = eligibleStaff.stream()
            .min(java.util.Comparator
                    .comparingLong((User staff) ->
                            complaintRepository
                                    .countByAssignedToIdAndStatusIn(
                                            staff.getId(),
                                            activeStatuses
                                    ))
                    .thenComparing(User::getId))
            .orElseThrow();

    lifecycleService.validateTransition(
            complaint.getStatus(),
            ComplaintStatus.ASSIGNED
    );

    complaint.setAssignedTo(selectedStaff);
    complaint.setStatus(ComplaintStatus.ASSIGNED);
    complaint.setUpdatedAt(LocalDateTime.now());

    Complaint saved = complaintRepository.save(complaint);

    ComplaintHistory history = new ComplaintHistory();
    history.setComplaint(saved);
    history.setStatus(ComplaintStatus.ASSIGNED);
    history.setAction("COMPLAINT_ASSIGNED");
    history.setMessage(
            "Automatically assigned to "
                    + selectedStaff.getName()
                    + " in "
                    + complaint.getDepartment().getName()
                    + " based on current workload."
    );
    history.setCreatedAt(LocalDateTime.now());

    historyRepository.save(history);

    return saved;
}


@Transactional
public Complaint assignComplaint(
        Long complaintId,
        Long staffId) {

    Complaint complaint =
            complaintRepository.findById(complaintId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Complaint not found"));

    User staff =
            userRepository.findById(staffId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Staff not found"));

    if (staff.getRole() != UserRole.STAFF) {
        throw new RuntimeException(
                "User is not a staff member");
    }
    if (staff.getDepartment() == null
        || complaint.getDepartment() == null
        || !staff.getDepartment().getId()
                .equals(complaint.getDepartment().getId())) {
    throw new IllegalArgumentException(
            "Staff member does not belong to the complaint's department"
    );
}
        
    // Validate that the complaint can be assigned now.
    // Route older OPEN complaints before assigning them.
if (complaint.getStatus() == ComplaintStatus.OPEN) {

    lifecycleService.validateTransition(
            ComplaintStatus.OPEN,
            ComplaintStatus.ROUTED
    );

    complaint.setStatus(ComplaintStatus.ROUTED);
    complaint.setUpdatedAt(LocalDateTime.now());

    Complaint routed = complaintRepository.save(complaint);

    ComplaintHistory routedHistory = new ComplaintHistory();
    routedHistory.setComplaint(routed);
    routedHistory.setStatus(ComplaintStatus.ROUTED);
    routedHistory.setAction("COMPLAINT_ROUTED");
    routedHistory.setMessage(
            "Complaint routed to "
                    + complaint.getDepartment().getName()
                    + " before manual assignment."
    );
    routedHistory.setCreatedAt(LocalDateTime.now());

    historyRepository.save(routedHistory);
}

// Validate the normal ROUTED → ASSIGNED transition.
lifecycleService.validateTransition(
        complaint.getStatus(),
        ComplaintStatus.ASSIGNED
);

    complaint.setAssignedTo(staff);
    complaint.setStatus(ComplaintStatus.ASSIGNED);
    complaint.setUpdatedAt(LocalDateTime.now());

    Complaint saved =
            complaintRepository.save(complaint);

    ComplaintHistory history =
            new ComplaintHistory();

    history.setComplaint(saved);
    history.setStatus(ComplaintStatus.ASSIGNED);
    history.setAction("COMPLAINT_ASSIGNED");
    history.setMessage(
            "Complaint assigned to "
            + staff.getName()
    );
    history.setCreatedAt(LocalDateTime.now());

    historyRepository.save(history);

    return saved;
}

        @Transactional
public Complaint updateStatus(
        Long complaintId,
        ComplaintStatus nextStatus,
        String staffEmail) {

    Complaint complaint = complaintRepository
            .findById(complaintId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Complaint not found"));

    User assignedStaff = complaint.getAssignedTo();

    if (assignedStaff == null
            || !assignedStaff.getEmail()
                    .equalsIgnoreCase(staffEmail)) {
        throw new org.springframework.security.access
                .AccessDeniedException(
                        "This complaint is not assigned to you");
    }

    ComplaintStatus previousStatus =
            complaint.getStatus();

    lifecycleService.validateTransition(
            previousStatus, nextStatus);

    complaint.setStatus(nextStatus);
    complaint.setUpdatedAt(LocalDateTime.now());

    Complaint saved = complaintRepository.save(complaint);

    ComplaintHistory history = new ComplaintHistory();
    history.setComplaint(saved);
    history.setStatus(nextStatus);
    history.setAction("STATUS_CHANGED");
    history.setMessage(
            "Status changed from " + previousStatus
                    + " to " + nextStatus);
    history.setCreatedAt(LocalDateTime.now());

    historyRepository.save(history);

    return saved;
}

@Transactional
public Complaint closeComplaint(Long complaintId) {

    Complaint complaint = complaintRepository
            .findById(complaintId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Complaint not found: " + complaintId));

    ComplaintStatus previousStatus = complaint.getStatus();

    lifecycleService.validateTransition(
            previousStatus,
            ComplaintStatus.CLOSED
    );

    complaint.setStatus(ComplaintStatus.CLOSED);

    LocalDateTime now = LocalDateTime.now();
    complaint.setUpdatedAt(now);

    Complaint saved = complaintRepository.save(complaint);

    ComplaintHistory history = new ComplaintHistory();
    history.setComplaint(saved);
    history.setStatus(ComplaintStatus.CLOSED);
    history.setAction("COMPLAINT_CLOSED");
    history.setMessage(
            "Admin closed the complaint after resolution.");
    history.setCreatedAt(now);

    historyRepository.save(history);

    return saved;
}

@Transactional
public Complaint reopenComplaint(
        Long complaintId,
        String studentEmail) {

    Complaint complaint = complaintRepository
            .findById(complaintId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Complaint not found: " + complaintId));

    boolean isOwner = complaint.getUser() != null
            && complaint.getUser().getEmail()
                    .equalsIgnoreCase(studentEmail);

    if (!isOwner) {
        throw new org.springframework.security.access
                .AccessDeniedException(
                        "You can only reopen your own complaints.");
    }

    ComplaintStatus previousStatus = complaint.getStatus();

    lifecycleService.validateTransition(
            previousStatus,
            ComplaintStatus.REOPENED
    );

    complaint.setStatus(ComplaintStatus.REOPENED);

    LocalDateTime now = LocalDateTime.now();
    complaint.setUpdatedAt(now);

    Complaint saved = complaintRepository.save(complaint);

    ComplaintHistory history = new ComplaintHistory();
    history.setComplaint(saved);
    history.setStatus(ComplaintStatus.REOPENED);
    history.setAction("COMPLAINT_REOPENED");
    history.setMessage(
            "Student reopened the complaint because the issue may not be resolved.");
    history.setCreatedAt(now);

    historyRepository.save(history);

    return saved;
}
@Transactional(readOnly = true)
public List<Complaint> getAssignedComplaints(String email) {
    return complaintRepository.findByAssignedToEmail(email);
}

}