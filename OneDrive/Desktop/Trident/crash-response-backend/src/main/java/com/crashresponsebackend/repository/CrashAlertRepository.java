package com.crashresponsebackend.repository;

import com.crashresponsebackend.model.CrashAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CrashAlertRepository extends JpaRepository<CrashAlert, Long> {

    List<CrashAlert> findByVehicleVehicleNumber(String vehicleNumber);

    Long countByVehicleVehicleNumber(String vehicleNumber);

    Long countBySeverity(String severity);

    @Query("SELECT AVG(TIMESTAMPDIFF(SECOND, c.timestamp, CURRENT_TIMESTAMP)) / 60.0 FROM CrashAlert c WHERE c.status = 'DISPATCHED' OR c.status = 'RESOLVED'")
    Double calculateAverageResponseTimeMinutes();
}