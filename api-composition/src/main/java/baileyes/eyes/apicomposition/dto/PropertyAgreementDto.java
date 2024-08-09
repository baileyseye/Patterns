package baileyes.eyes.apicomposition.dto;

import java.math.BigDecimal;
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
public class PropertyAgreementDto extends CommonDto {

    private UUID propertyInsuranceId;

    private LocalDate startDate;

    private LocalDate endDate;

    private AddressDto address;

    private BigDecimal sumInsured;
}
