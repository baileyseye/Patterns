package baileyes.eyes.apicomposition.service.agregate.facade.agreements;

import baileyes.eyes.apicomposition.dto.CommonDto;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public interface ConcurrentAgreementsService<T extends CommonDto> {

    CompletableFuture<List<T>> getAgreements(UUID individualId);
}
