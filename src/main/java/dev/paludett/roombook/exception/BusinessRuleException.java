package dev.paludett.roombook.exception;

/** Violação de regra de negócio / conflito de estado. Vira 409. */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
