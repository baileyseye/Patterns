package baileyes.eyes.apicomposition.dto;

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
public class TravelInsuredPeopleDto {

    private UUID travelInsuredPeopleId;

    private UUID clientId;
}
