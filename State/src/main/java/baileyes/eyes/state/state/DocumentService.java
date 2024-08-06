package baileyes.eyes.state.state;

import baileyes.eyes.state.dto.Document;
import baileyes.eyes.state.state.enam.DocumentState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final Document document;

    public void processDocument() {
        log.info("Начинаем обработку документа...");
        log.info("Текущее состояние документа: " + document.getState());
        
        document.review();
        log.info("Состояние после рассмотрения: " + document.getState());


        document.setState(DocumentState.AWAITING_CONFIRMATION);
        log.info("Состояние после установки на ожидание подтверждения: " + document.getState());
        
        document.confirm();
        log.info("Состояние после подтверждения: " + document.getState());

        document.reject();
        log.info("Состояние после попытки отклонения: " + document.getState());
        
        document.review();
        log.info("Состояние после возврата на рассмотрение: " + document.getState());
    }

    /**
     * Метод для явного изменения состояния документа.
     * @param newState Новое состояние документа.
     */
    public void changeDocumentState(DocumentState newState) {
        document.setState(newState);
    }
}
