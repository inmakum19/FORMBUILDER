package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ApplicationService extends CrudService<Application, String> {

    Mono<Application> findById(String id);

    Mono<Application> findById(String id, AclPermission aclPermission);

    Mono<Application> findByIdAndOrganizationId(String id, String organizationId, AclPermission permission);

    Flux<Application> findByOrganizationId(String organizationId, AclPermission permission);

    Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission);

    Mono<Application> findByName(String name, AclPermission permission);

    Mono<Application> save(Application application);

    Mono<Application> createDefault(Application object);

    Mono<Application> archive(Application application);

    Mono<Application> changeViewAccess (String id, ApplicationAccessDTO applicationAccessDTO);

    Flux<Application> findAllApplicationsByOrganizationId(String organizationId);

    Mono<Application> getApplicationInViewMode(String applicationId);

    Mono<Application> saveLastEditInformation(String applicationId);

    Mono<Application> setTransientFields(Application application);

    Mono<GitAuth> createOrUpdateSshKeyPair(String applicationId);

    Mono<GitAuth> getSshKey(String applicationId);

    Mono<Application> getApplicationByBranchNameAndDefaultApplication(String branchName,
                                                                      String defaultApplicationId,
                                                                      AclPermission aclPermission);

    Mono<String> getChildApplicationId(String branchName, String defaultApplicationId, AclPermission permission);

    Flux<Application> findAllApplicationsByGitDefaultApplicationId(String defaultApplicationId);
}
