package dev.paludett.roombook.exception;

/** Entrada semanticamente inválida (fora das regras de formato/horário). Vira 400. */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
