package baileyes.eyes.apicomposition.dto;

import java.time.LocalDate;
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
public class DmsAgreementDto extends CommonDto {

    private UUID dmsInsuranceId;

    private LocalDate startDate;

    private LocalDate endDate;

    private UUID individualId;

    private UUID clientId;
}
