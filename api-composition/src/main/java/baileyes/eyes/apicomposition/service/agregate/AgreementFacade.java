package baileyes.eyes.apicomposition.service.agregate;

import baileyes.eyes.apicomposition.dto.CommonDto;
import baileyes.eyes.apicomposition.service.agregate.facade.agreements.ConcurrentAgreementsService;
import baileyes.eyes.apicomposition.service.agregate.facade.agreements.DmsAgreementsService;
import baileyes.eyes.apicomposition.service.agregate.facade.agreements.PropertyAgreementsService;
import baileyes.eyes.apicomposition.service.agregate.facade.agreements.TravelAgreementsService;
import baileyes.eyes.apicomposition.service.agregate.facade.clients.ConcurrentClientService;
import baileyes.eyes.apicomposition.service.agregate.facade.clients.DmsServiceClient;
import baileyes.eyes.apicomposition.service.agregate.facade.clients.TravelServiceClient;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.Contract;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Unmodifiable;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class AgreementFacade {

    /**
     * DMS сервис
     */
    private final DmsAgreementsService dmsService;

    /**
     * Property сервис
     */
    private final PropertyAgreementsService propertyService;

    /**
     * Travel сервис
     */
    private final TravelAgreementsService travelService;

    /**
     * DMS клиент
     */
    private final DmsServiceClient dmsServiceClient;

    /**
     * Travel клиент
     */
    private final TravelServiceClient travelServiceClient;

    /**
     * Получение сгруппированных договоров
     *
     * @param individualId идентификатор физического лица
     * @return список сгруппированных договоров
     */
    public CompletableFuture<Map<String, List<CommonDto>>> getAggregatedAgreements(
            UUID individualId) {
        var agreementServices = getConcurrentAgreementsServices();

        var clientServices = getConcurrentClientServices();

        return getMapCompletableFuture(individualId,
                agreementServices,
                clientServices);
    }

    private static CompletableFuture<Map<String, List<CommonDto>>> getMapCompletableFuture(
            UUID individualId,
            List<ConcurrentAgreementsService<?>> agreementServices,
            List<ConcurrentClientService> clientServices) {

        var agreementsFuture = getListCompletableFuture(individualId, agreementServices);
        var clientsFuture = getCompletableFuture(individualId, clientServices);

        return
                CompletableFuture.allOf(agreementsFuture, clientsFuture)
                        .thenApply(voidResult -> {
                            Map<String, List<CommonDto>> response = new LinkedHashMap<>();
                            response.put("agreements", agreementsFuture.join());
                            response.put("clients", clientsFuture.join());
                            return response;
                        });
    }

    private static CompletableFuture<List<CommonDto>> getCompletableFuture(UUID individualId,
            @NotNull List<ConcurrentClientService> clientServices) {

        return CompletableFuture.allOf(
                        clientServices.stream()
                                .map(service -> service.getClientsByAgreements(individualId))
                                .toArray(CompletableFuture[]::new))
                .thenApply(voidResult -> clientServices.stream()
                        .flatMap(service -> service.getClientsByAgreements(individualId).join()
                                .values().stream())
                        .collect(Collectors.toList()));
    }

    private static CompletableFuture<List<CommonDto>> getListCompletableFuture(UUID individualId,
            @NotNull List<ConcurrentAgreementsService<?>> agreementServices) {

        return CompletableFuture.allOf(
                        agreementServices.stream()
                                .map(service -> service.getAgreements(individualId))
                                .toArray(CompletableFuture[]::new))
                .thenApply(voidResult -> agreementServices.stream()
                        .flatMap(service -> service.getAgreements(individualId).join().stream())
                        .collect(Collectors.toList()));
    }

    @Contract(value = " -> new", pure = true)
    private @NotNull @Unmodifiable List<ConcurrentClientService> getConcurrentClientServices() {
        return List.of(
                dmsServiceClient,
                travelServiceClient
        );
    }

    @Contract(value = " -> new", pure = true)
    private @Unmodifiable List<ConcurrentAgreementsService<?>> getConcurrentAgreementsServices() {
        return List.of(
                dmsService,
                propertyService,
                travelService
        );
    }
}
