package baileyes.eyes.apicomposition.feign;

import baileyes.eyes.apicomposition.dto.ClientDto;
import java.util.List;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "user-service", url = "${USER_SERVICE_URL}")
public interface UserClient {

    /**
     * Получение клиента по идентификатору клиента
     *
     * @param clientId Идентификатор клиента
     * @return Информация о клиенте
     */

    @PostMapping("${USER_API}clients")
    ResponseEntity<List<ClientDto>> getClientsByIdIn(
            @RequestBody List<UUID> clientId);
}
