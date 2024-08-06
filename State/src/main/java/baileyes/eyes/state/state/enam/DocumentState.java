package baileyes.eyes.state.state.enam;

import baileyes.eyes.state.dto.Document;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public enum DocumentState {

    UNDER_REVIEW {

        @Override
        public DocumentState review(Document document) {
            return message("Документ уже на рассмотрении.", this);
        }

        @Override
        public DocumentState confirm(Document document) {
            return message("Документ подтвержден.", CONFIRMED);
        }

        @Override
        public DocumentState reject(Document document) {
            return message("Документ отклонен.", REJECTED);
        }
    },

    AWAITING_CONFIRMATION {

        @Override
        public DocumentState review(Document document) {
            return message("Документ возвращен на рассмотрение.", UNDER_REVIEW);
        }

        @Override
        public DocumentState confirm(Document document) {
            return message("Документ подтвержден.", CONFIRMED);
        }

        @Override
        public DocumentState reject(Document document) {
            return message("Документ отклонен.", REJECTED);
        }
    },

    CONFIRMED {

        @Override
        public DocumentState review(Document document) {
            return message("Документ уже подтвержден, его нельзя вернуть на рассмотрение.", this);
        }

        @Override
        public DocumentState confirm(Document document) {
            return message("Документ уже подтвержден.", this);
        }

        @Override
        public DocumentState reject(Document document) {
            return message("Документ уже подтвержден, его нельзя отклонить.", this);
        }
    },

    REJECTED {

        @Override
        public DocumentState review(Document document) {
            return message("Документ возвращен на рассмотрение.", UNDER_REVIEW);
        }

        @Override
        public DocumentState confirm(Document document) {
            return message("Документ отклонен, его нельзя подтвердить.", this);
        }

        @Override
        public DocumentState reject(Document document) {
            return message("Документ уже отклонен.", this);
        }
    };

    private static DocumentState message(String message, DocumentState state) {
        log.info(message);

        return state;
    }

    public abstract DocumentState review(Document document);
    public abstract DocumentState confirm(Document document);
    public abstract DocumentState reject(Document document);
}
