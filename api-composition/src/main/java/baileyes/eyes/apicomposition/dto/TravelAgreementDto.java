package baileyes.eyes.apicomposition.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelAgreementDto extends CommonDto{

    private UUID travelInsuranceId;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<TravelInsuredPeopleDto> travelInsuredPeople;
}
