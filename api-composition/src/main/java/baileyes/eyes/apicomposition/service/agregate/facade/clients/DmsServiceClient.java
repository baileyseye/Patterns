package baileyes.eyes.apicomposition.service.agregate.facade.clients;

import baileyes.eyes.apicomposition.dto.ClientDto;
import baileyes.eyes.apicomposition.dto.DmsAgreementDto;
import baileyes.eyes.apicomposition.feign.DmsClient;
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
public class DmsServiceClient implements ConcurrentClientService {

    /**
     * Сервис для получения договоров по идентификатору физического лица
     */
    private final DmsClient dmsClient;

    /**
     * Сервис для получения клиентов по идентификатору договора
     */
    private final UserClient userClient;

    @Override
    public CompletableFuture<Map<UUID, ClientDto>> getClientsByAgreements(UUID individualId) {
        return CompletableFuture.supplyAsync(() -> {
            List<DmsAgreementDto> dmsAgreementDtos = dmsClient.getAgreementsByIndividualId(individualId);
            List<UUID> clientIds = dmsAgreementDtos.stream()
                    .map(DmsAgreementDto::getClientId)
                    .toList();

            var clients = userClient.getClientsByIdIn(clientIds);

            return Objects.requireNonNull(clients.getBody()).stream()
                    .collect(Collectors.toMap(ClientDto::getClientId, Function.identity()));
        });
    }
}
