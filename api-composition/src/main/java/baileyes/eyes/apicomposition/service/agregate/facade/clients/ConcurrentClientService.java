package baileyes.eyes.apicomposition.service.agregate.facade.clients;

import baileyes.eyes.apicomposition.dto.ClientDto;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface ConcurrentClientService {

    CompletableFuture<Map<UUID, ClientDto>> getClientsByAgreements(UUID individualId);
}
