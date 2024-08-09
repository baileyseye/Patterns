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
public class AddressDto {

    private UUID addressId;

    private String region;

    private String district;

    private String city;

    private String street;

    private String buildNumber;

    private String houseNumber;

    private String apartmentNumber;

    private PropertyType propertyType;
}
