package main.web.rest;

import jakarta.validation.Valid;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.*;
import main.domain.PersistentToken;
import main.domain.User;
import main.repository.PersistentTokenRepository;
import main.repository.UserRepository;
import main.security.SecurityUtils;
import main.service.MailService;
import main.service.UserService;
import main.service.dto.AdminUserDTO;
import main.service.dto.PasswordChangeDTO;
import main.web.rest.errors.*;
import main.web.rest.vm.KeyAndPasswordVM;
import main.web.rest.vm.ManagedUserVM;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing the current user's account.
 */
@RestController
@RequestMapping("/api")
public class AccountResource {

    private static class AccountResourceException extends RuntimeException {

        private AccountResourceException(String message) {
            super(message);
        }
    }

    private static final Logger LOG = LoggerFactory.getLogger(AccountResource.class);

    private final UserRepository userRepository;

    private final UserService userService;

    private final MailService mailService;

    private final PersistentTokenRepository persistentTokenRepository;

    public AccountResource(
        UserRepository userRepository,
        UserService userService,
        MailService mailService,
        PersistentTokenRepository persistentTokenRepository
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.mailService = mailService;
        this.persistentTokenRepository = persistentTokenRepository;
    }

    /**
     * {@code POST  /register} : registra un nuovo utente.
     *
     * Il nuovo utente viene salvato come NON attivato.
     * L'utente riceve una email "in attesa di approvazione".
     * L'admin dovrà approvare l'account dalla sezione di gestione utenti.
     *
     * @param managedUserVM the managed user View Model.
     * @throws InvalidPasswordException {@code 400 (Bad Request)} se la password non è valida.
     * @throws EmailAlreadyUsedException {@code 400 (Bad Request)} se l'email è già in uso.
     * @throws LoginAlreadyUsedException {@code 400 (Bad Request)} se il login è già in uso.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void registerAccount(@Valid @RequestBody ManagedUserVM managedUserVM) {
        if (isPasswordLengthInvalid(managedUserVM.getPassword())) {
            throw new InvalidPasswordException();
        }
        User user = userService.registerUser(managedUserVM, managedUserVM.getPassword());
        // Invia email "in attesa di approvazione" invece dell'email di attivazione diretta
        mailService.sendPendingApprovalEmail(user);
    }

    /**
     * {@code GET  /activate} : attiva l'utente registrato tramite chiave.
     * (Mantenuto per compatibilità, ma il flusso principale ora usa l'approvazione admin)
     *
     * @param key the activation key.
     * @throws RuntimeException {@code 500 (Internal Server Error)} se l'utente non è trovato.
     */
    @GetMapping("/activate")
    public void activateAccount(@RequestParam(value = "key") String key) {
        Optional<User> user = userService.activateRegistration(key);
        if (!user.isPresent()) {
            throw new AccountResourceException("No user was found for this activation key");
        }
    }

    /**
     * {@code GET  /authenticate} : controlla se l'utente è autenticato.
     *
     * @return {@link ResponseEntity} con status {@code 204 (No Content)},
     * o {@code 401 (Unauthorized)} se non autenticato.
     */
    @GetMapping("/authenticate")
    public ResponseEntity<Void> isAuthenticated(Principal principal) {
        LOG.debug("REST request to check if the current user is authenticated");
        return ResponseEntity.status(principal == null ? HttpStatus.UNAUTHORIZED : HttpStatus.NO_CONTENT).build();
    }

    /**
     * {@code GET  /account} : restituisce l'utente corrente.
     *
     * @return l'utente corrente.
     * @throws RuntimeException {@code 500 (Internal Server Error)} se l'utente non è trovato.
     */
    @GetMapping("/account")
    public AdminUserDTO getAccount() {
        return userService
            .getUserWithAuthorities()
            .map(AdminUserDTO::new)
            .orElseThrow(() -> new AccountResourceException("User could not be found"));
    }

    /**
     * {@code POST  /account} : aggiorna le informazioni dell'utente corrente.
     *
     * @param userDTO le informazioni aggiornate dell'utente corrente.
     * @throws EmailAlreadyUsedException {@code 400 (Bad Request)} se l'email è già in uso.
     * @throws RuntimeException {@code 500 (Internal Server Error)} se il login non è trovato.
     */
    @PostMapping("/account")
    public void saveAccount(@Valid @RequestBody AdminUserDTO userDTO) {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new AccountResourceException("Current user login not found"));
        Optional<User> existingUser = userRepository.findOneByEmailIgnoreCase(userDTO.getEmail());
        if (existingUser.isPresent() && (!existingUser.orElseThrow().getLogin().equalsIgnoreCase(userLogin))) {
            throw new EmailAlreadyUsedException();
        }
        Optional<User> user = userRepository.findOneByLogin(userLogin);
        if (!user.isPresent()) {
            throw new AccountResourceException("User could not be found");
        }
        userService.updateUser(
            userDTO.getFirstName(),
            userDTO.getLastName(),
            userDTO.getEmail(),
            userDTO.getLangKey(),
            userDTO.getImageUrl()
        );
    }

    /**
     * {@code POST  /account/change-password} : cambia la password dell'utente corrente.
     *
     * @param passwordChangeDto la password attuale e la nuova.
     * @throws InvalidPasswordException {@code 400 (Bad Request)} se la nuova password non è valida.
     */
    @PostMapping(path = "/account/change-password")
    public void changePassword(@RequestBody PasswordChangeDTO passwordChangeDto) {
        if (isPasswordLengthInvalid(passwordChangeDto.getNewPassword())) {
            throw new InvalidPasswordException();
        }
        userService.changePassword(passwordChangeDto.getCurrentPassword(), passwordChangeDto.getNewPassword());
    }

    /**
     * {@code GET  /account/sessions} : restituisce le sessioni aperte dell'utente corrente.
     *
     * @return le sessioni aperte correnti.
     * @throws RuntimeException {@code 500 (Internal Server Error)} se le sessioni non sono recuperabili.
     */
    @GetMapping("/account/sessions")
    public List<PersistentToken> getCurrentSessions() {
        return persistentTokenRepository.findByUser(
            userRepository
                .findOneByLogin(
                    SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new AccountResourceException("Current user login not found"))
                )
                .orElseThrow(() -> new AccountResourceException("User could not be found"))
        );
    }

    /**
     * {@code DELETE  /account/sessions?series={series}} : invalida una sessione esistente.
     *
     * @param series the series of an existing session.
     * @throws IllegalArgumentException if the series couldn't be URL decoded.
     */
    @DeleteMapping("/account/sessions/{series}")
    public void invalidateSession(@PathVariable("series") String series) {
        String decodedSeries = URLDecoder.decode(series, StandardCharsets.UTF_8);
        SecurityUtils.getCurrentUserLogin()
            .flatMap(userRepository::findOneByLogin)
            .ifPresent(u ->
                persistentTokenRepository
                    .findByUser(u)
                    .stream()
                    .filter(persistentToken -> StringUtils.equals(persistentToken.getSeries(), decodedSeries))
                    .findAny()
                    .ifPresent(t -> persistentTokenRepository.deleteById(decodedSeries))
            );
    }

    /**
     * {@code POST   /account/reset-password/init} : invia email per il reset della password.
     *
     * @param mail l'email dell'utente.
     */
    @PostMapping(path = "/account/reset-password/init")
    public void requestPasswordReset(@RequestBody String mail) {
        Optional<User> user = userService.requestPasswordReset(mail);
        if (user.isPresent()) {
            mailService.sendPasswordResetMail(user.orElseThrow());
        } else {
            LOG.warn("Password reset requested for non existing mail");
        }
    }

    /**
     * {@code POST   /account/reset-password/finish} : completa il reset della password.
     *
     * @param keyAndPassword la chiave generata e la nuova password.
     * @throws InvalidPasswordException {@code 400 (Bad Request)} se la password non è valida.
     * @throws RuntimeException {@code 500 (Internal Server Error)} se la password non può essere reimpostata.
     */
    @PostMapping(path = "/account/reset-password/finish")
    public void finishPasswordReset(@RequestBody KeyAndPasswordVM keyAndPassword) {
        if (isPasswordLengthInvalid(keyAndPassword.getNewPassword())) {
            throw new InvalidPasswordException();
        }
        Optional<User> user = userService.completePasswordReset(keyAndPassword.getNewPassword(), keyAndPassword.getKey());

        if (!user.isPresent()) {
            throw new AccountResourceException("No user was found for this reset key");
        }
    }

    private static boolean isPasswordLengthInvalid(String password) {
        return (
            StringUtils.isEmpty(password) ||
            password.length() < ManagedUserVM.PASSWORD_MIN_LENGTH ||
            password.length() > ManagedUserVM.PASSWORD_MAX_LENGTH
        );
    }
}
