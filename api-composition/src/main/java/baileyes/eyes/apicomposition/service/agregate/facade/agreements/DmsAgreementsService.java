package baileyes.eyes.apicomposition.service.agregate.facade.agreements;

import baileyes.eyes.apicomposition.dto.DmsAgreementDto;
import baileyes.eyes.apicomposition.feign.DmsClient;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Slf4j
@Service
@RequiredArgsConstructor
public class DmsAgreementsService implements ConcurrentAgreementsService<DmsAgreementDto> {

    private final DmsClient dmsClient;

    @Override
    public CompletableFuture<List<DmsAgreementDto>> getAgreements(UUID individualId) {
        return CompletableFuture.supplyAsync(() -> dmsClient.getAgreementsByIndividualId(individualId));
    }
}
