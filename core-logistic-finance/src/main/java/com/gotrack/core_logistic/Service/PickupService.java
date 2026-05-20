package com.gotrack.core_logistic.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.gotrack.core_logistic.ExceptionHandling.ConflictException;
import com.gotrack.core_logistic.ExceptionHandling.ResourceNotFoundException;
import com.gotrack.core_logistic.Specifications.PickupSpecification;
import com.gotrack.core_logistic.enums.PickupStatus;
import com.gotrack.core_logistic.filter.AuthenticationDetails;
import com.gotrack.core_logistic.mapper.PickupRequestMapper;
import com.gotrack.core_logistic.model.dto.DTOFilters.PickupFilter;
import com.gotrack.core_logistic.model.dto.PickupRequestDTO;
import com.gotrack.core_logistic.model.dto.ProfileResponse;
import com.gotrack.core_logistic.model.entity.Pickup;
import com.gotrack.core_logistic.repository.PickupRepo;

@Service
public class PickupService {

        @Autowired
        private PickupRepo pickupRepository;
        @Autowired
        private PickupRequestMapper pickupMapper;
        @Autowired
        private ProfileBranchService profileBranchService;
        

        public PickupRequestDTO createPickup(PickupRequestDTO pickupRequest) {
                Pickup pickup = pickupMapper.toEntity(pickupRequest);
                
                AuthenticationDetails authDetails = new AuthenticationDetails();
                String accountId = authDetails.getAccountId();
                ProfileResponse profile = profileBranchService.getProfileByAccountId(accountId);

                pickup.setMERCHANTId(profile.getId());
                pickup.setStatus(PickupStatus.Pending);
                Pickup savedPickup = pickupRepository.save(pickup);
                return pickupMapper.toDTO(savedPickup);

        }

        public PickupRequestDTO updatePickup(Long id, PickupRequestDTO pickupRequest) {
                Pickup existingPickup = pickupRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Pickup not found with id: " + id));

                PickupStatus currentStatus = existingPickup.getStatus();
                PickupStatus newStatus = pickupRequest.getStatus();

                if (currentStatus == PickupStatus.Completed || currentStatus == PickupStatus.Cancelled) {
                        throw new ConflictException("Pickup is already completed or cancelled");
                }

                if (!currentStatus.canTransitionTo(newStatus)) {
                        throw new ConflictException(
                                        "Pickup cannot be transitioned from " + currentStatus + " to " + newStatus);
                }

                existingPickup.setPickupTime(pickupRequest.getPickupTime());
                existingPickup.setStatus(newStatus);

                Pickup updatedPickup = pickupRepository.save(existingPickup);
                return pickupMapper.toDTO(updatedPickup);

        }

        public PickupRequestDTO assignCourier(Long id, Long courierId) {
                Pickup existingPickup = pickupRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Pickup not found with id: " + id));

                ProfileResponse profile = profileBranchService.getProfileById(courierId);
                if (profile.getType().toString() != "COURIER")
                        throw new ConflictException("This is not a courier profile");

                existingPickup.setCourierId(courierId);
                existingPickup.setStatus(PickupStatus.CurierAssigned);

                Pickup updatedPickup = pickupRepository.save(existingPickup);
                return pickupMapper.toDTO(updatedPickup);
        }

        public Page<PickupRequestDTO> searchPickups(PickupFilter filter, Pageable pageable) {

                  
                AuthenticationDetails authDetails = new AuthenticationDetails();
                String accountId = authDetails.getAccountId();
                ProfileResponse profile = profileBranchService.getProfileByAccountId(accountId);

                if (filter.getMERCHANTId() != null && filter.getMERCHANTId() != profile.getId()
                                && profile.getType().toString() == "MERCHANT") {
                        throw new ConflictException("You are not authorized to search pickups for this merchant");
                }

                // if (profile.getType().toString() == "MERCHANT")
                //         filter.setMERCHANTId(profile.getId());

                Specification<Pickup> spec = PickupSpecification.filterPickups(filter);
                return pickupRepository.findAll(spec, pageable)
                                .map(pickupMapper::toDTO);
        }



        public PickupRequestDTO getPickup(Long id) {
                Pickup pickup = pickupRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Pickup not found with id: " + id));

                return pickupMapper.toDTO(pickup);
        }
}
