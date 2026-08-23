package com.crashresponsebackend.controller;

import com.crashresponsebackend.model.Vehicle;
import com.crashresponsebackend.repository.VehicleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    public VehicleController(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerVehicle(@RequestBody Vehicle vehicle) {
        if (vehicleRepository.findByVehicleNumber(vehicle.getVehicleNumber()).isPresent()) {
            return ResponseEntity.badRequest().body("Vehicle number already registered.");
        }
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(savedVehicle);
    }

    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }
}