package baileyes.eyes.apicomposition.service.agregate.facade.clients;

import baileyes.eyes.apicomposition.dto.ClientDto;
import baileyes.eyes.apicomposition.dto.TravelAgreementDto;
import baileyes.eyes.apicomposition.feign.TravelClient;
import baileyes.eyes.apicomposition.feign.UserClient;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TravelServiceClient implements ConcurrentClientService {

    /**
     * Сервис для получения договоров по идентификатору физического лица
     */
    private final TravelClient travelClient;

    /**
     * Сервис для получения клиентов по идентификаторам
     */
    private final UserClient userClient;

    public CompletableFuture<Map<UUID, ClientDto>> getClientsByAgreements(UUID individualId) {
        return CompletableFuture.supplyAsync(() -> {
            List<TravelAgreementDto> travelAgreementDtos = travelClient.getTravelInsurancesByIndividualId(individualId);
            List<UUID> clientIds = travelAgreementDtos.stream()
                    .flatMap(agreement -> agreement.getTravelInsuredPeople().stream())
                    .map(TravelInsuredPeopleDto::getClientId)
                    .distinct()
                    .toList();

            var clients = userClient.getClientsByIdIn(clientIds);

            return Objects.requireNonNull(clients.getBody()).stream()
                    .collect(Collectors.toMap(ClientDto::getClientId, Function.identity()));
        });
    }
}
