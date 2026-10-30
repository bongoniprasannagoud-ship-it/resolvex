
package com.college.complaint_system.service;

import com.college.complaint_system.entity.ComplaintStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
public class ComplaintLifecycleService {

    private final Map<ComplaintStatus, Set<ComplaintStatus>>
            allowedTransitions = Map.of(
                ComplaintStatus.OPEN,
                Set.of(
                        ComplaintStatus.ROUTED,
                        ComplaintStatus.PENDING_REVIEW
                ),

                ComplaintStatus.PENDING_REVIEW,
                Set.of(ComplaintStatus.ROUTED),

                ComplaintStatus.ROUTED,
                Set.of(ComplaintStatus.ASSIGNED),

                ComplaintStatus.ASSIGNED,
                Set.of(ComplaintStatus.IN_PROGRESS),

                ComplaintStatus.IN_PROGRESS,
                Set.of(ComplaintStatus.RESOLVED),

                ComplaintStatus.RESOLVED,
                Set.of(
                        ComplaintStatus.CLOSED,
                        ComplaintStatus.REOPENED
                ),

                ComplaintStatus.CLOSED,
                Set.of(ComplaintStatus.REOPENED),


                ComplaintStatus.REOPENED,
                Set.of(
                        ComplaintStatus.ASSIGNED,
                        ComplaintStatus.IN_PROGRESS
                )

            );

    public void validateTransition(
            ComplaintStatus current,
            ComplaintStatus next) {

        Set<ComplaintStatus> allowed =
                allowedTransitions.getOrDefault(
                        current, Set.of());

        if (!allowed.contains(next)) {
            throw new IllegalStateException(
                    "Cannot change complaint status from "
                    + current + " to " + next);
        }
    }
}
