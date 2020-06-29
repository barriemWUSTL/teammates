import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { default as templateSessions } from '../data/template-sessions.json';
import { ResourceEndpoints } from '../types/api-endpoints';
import {
  ConfirmationResponse,
  FeedbackQuestion,
  FeedbackSession,
  FeedbackSessionPublishStatus,
  FeedbackSessions, FeedbackSessionStats, FeedbackSessionSubmittedGiverSet,
  HasResponses,
  MessageOutput,
  OngoingSessions, SessionLinksRecoveryResponse, SessionResults,
} from '../types/api-output';
import {
  FeedbackSessionCreateRequest,
  FeedbackSessionStudentRemindRequest,
  FeedbackSessionUpdateRequest, Intent,
} from '../types/api-request';
import { HttpRequestService } from './http-request.service';
import { TimezoneService } from './timezone.service';

/**
 * A template session.
 */
export interface TemplateSession {
  name: string;
  questions: FeedbackQuestion[];
}

/**
 * Handles sessions related logic provision.
 */
@Injectable({
  providedIn: 'root',
})
export class FeedbackSessionsService {

  constructor(private httpRequestService: HttpRequestService,
              private timezoneService: TimezoneService) {
  }

  /**
   * Gets template sessions.
   */
  getTemplateSessions(): TemplateSession[] {
    return templateSessions as any;
  }

  /**
   * Retrieves a feedback session by calling API.
   */
  getFeedbackSession(queryParams: {
    courseId: string,
    feedbackSessionName: string,
    intent: Intent,
    key?: string,
    moderatedPerson?: string,
    previewAs?: string,
  }): Observable<FeedbackSession> {
    // load feedback session
    const paramMap: Record<string, string> = {
      intent: queryParams.intent,
      courseid: queryParams.courseId,
      fsname: queryParams.feedbackSessionName,
    };

    if (queryParams.key) {
      paramMap.key = queryParams.key;
    }

    if (queryParams.moderatedPerson) {
      paramMap.moderatedperson = queryParams.moderatedPerson;
    }

    if (queryParams.previewAs) {
      paramMap.previewas = queryParams.previewAs;
    }

    return this.httpRequestService.get(ResourceEndpoints.SESSION, paramMap);
  }

  /**
   * Creates a feedback session by calling API.
   */
  createFeedbackSession(courseId: string, request: FeedbackSessionCreateRequest): Observable<FeedbackSession> {
    const paramMap: Record<string, string> = { courseid: courseId };
    return this.httpRequestService.post(ResourceEndpoints.SESSION, paramMap, request);
  }

  /**
   * Updates a feedback session by calling API.
   */
  updateFeedbackSession(courseId: string, feedbackSessionName: string, request: FeedbackSessionUpdateRequest):
      Observable<FeedbackSession> {
    const paramMap: Record<string, string> = { courseid: courseId, fsname: feedbackSessionName };
    return this.httpRequestService.put(ResourceEndpoints.SESSION, paramMap, request);
  }

  /**
   * Deletes a feedback session by calling API.
   */
  deleteFeedbackSession(courseId: string, feedbackSessionName: string): Observable<FeedbackSession> {
    const paramMap: Record<string, string> = { courseid: courseId, fsname: feedbackSessionName };
    return this.httpRequestService.delete(ResourceEndpoints.SESSION, paramMap);
  }

  /**
   * Gets all ongoing session by calling API.
   */
  getOngoingSessions(startTime: number, endTime: number): Observable<OngoingSessions> {
    const paramMap: Record<string, string> = {
      starttime: String(startTime),
      endtime: String(endTime),
    };
    return this.httpRequestService.get(ResourceEndpoints.SESSIONS_ONGOING, paramMap);
  }

  /**
   * Gets all sessions for the instructor by calling API.
   */
  getFeedbackSessionsForInstructor(courseId?: string): Observable<FeedbackSessions> {

    let paramMap: Record<string, string>;
    if (courseId != null) {
      paramMap = {
        entitytype: 'instructor',
        courseid: courseId,
      };
    } else {
      paramMap = {
        entitytype: 'instructor',
        isinrecyclebin: 'false',
      };
    }

    return this.httpRequestService.get(ResourceEndpoints.SESSIONS, paramMap);
  }

  /**
   * Gets all sessions in the recycle bin for the instructor by calling API.
   */
  getFeedbackSessionsInRecycleBinForInstructor(): Observable<FeedbackSessions> {

    const paramMap: Record<string, string> = {
      entitytype: 'instructor',
      isinrecyclebin: 'true',
    };

    return this.httpRequestService.get(ResourceEndpoints.SESSIONS, paramMap);
  }

  /**
   * Gets all sessions for the student by calling API.
   */
  getFeedbackSessionsForStudent(courseId?: string): Observable<FeedbackSessions> {

    let paramMap: Record<string, string>;
    if (courseId != null) {
      paramMap = {
        entitytype: 'student',
        courseid: courseId,
      };
    } else {
      paramMap = {
        entitytype: 'student',
      };
    }

    return this.httpRequestService.get(ResourceEndpoints.SESSIONS, paramMap);
  }

  /**
   * Checks if there are responses for a specific question in a feedback session (request sent by instructor).
   */
  hasResponsesForQuestion(questionId: string): Observable<HasResponses> {
    const paramMap: Record<string, string> = {
      entitytype: 'instructor',
      questionid: questionId,
    };
    return this.httpRequestService.get(ResourceEndpoints.HAS_RESPONSES, paramMap);
  }

  /**
   * Checks if there is response of a student for a feedback session (request sent by student).
   */
  hasStudentResponseForFeedbackSession(courseId: string, feedbackSessionName: string): Observable<HasResponses> {
    const paramMap: Record<string, string> = {
      entitytype: 'student',
      courseid: courseId,
      fsname: feedbackSessionName,

    };
    return this.httpRequestService.get(ResourceEndpoints.HAS_RESPONSES, paramMap);
  }

  /**
   * Sends e-mails to remind students who have not submitted their feedback.
   */
  remindFeedbackSessionSubmissionForStudent(
      courseId: string, feedbackSessionName: string, request: FeedbackSessionStudentRemindRequest)
      : Observable<MessageOutput> {
    const paramMap: Record<string, string> = {
      courseid: courseId,
      fsname: feedbackSessionName,
    };

    return this.httpRequestService.post(ResourceEndpoints.SESSION_REMIND_SUBMISSION, paramMap, request);
  }

  /**
   * Saves and confirms a submission by posting it using API.
   */
  confirmSubmission(queryParams: {
    courseId: string,
    feedbackSessionName: string,
    sendSubmissionEmail: string,
    intent: string,
    key: string,
    moderatedPerson: string,
  }): Observable<ConfirmationResponse> {
    const paramMap: Record<string, string> = {
      courseid: queryParams.courseId,
      fsname: queryParams.feedbackSessionName,
      sendsubmissionemail: queryParams.sendSubmissionEmail,
      intent: queryParams.intent,
      key: queryParams.key,
      moderatedperson: queryParams.moderatedPerson,
    };

    return this.httpRequestService.post(ResourceEndpoints.SUBMISSION_CONFIRMATION, paramMap);
  }

  /**
   * Sends e-mails to remind students on the published results link.
   */
  remindResultsLinkToStudents(
      courseId: string, feedbackSessionName: string, request: FeedbackSessionStudentRemindRequest)
      : Observable<MessageOutput> {
    const paramMap: Record<string, string> = {
      courseid: courseId,
      fsname: feedbackSessionName,
    };

    return this.httpRequestService.post(ResourceEndpoints.SESSION_REMIND_RESULT, paramMap, request);
  }

  /**
   * Gets a set of givers that has given at least one response in the feedback session.
   */
  getFeedbackSessionSubmittedGiverSet(queryParams: { courseId: string, feedbackSessionName: string }):
      Observable<FeedbackSessionSubmittedGiverSet> {
    const paramMap: Record<string, string> = {
      courseid: queryParams.courseId,
      fsname: queryParams.feedbackSessionName,
    };
    return this.httpRequestService.get(ResourceEndpoints.SESSION_SUBMITTED_GIVER_SET, paramMap);
  }

  /**
   * publishes a feedback session.
   */
  publishFeedbackSession(courseId: string, feedbackSessionName: string): Observable<FeedbackSession> {
    const paramMap: Record<string, string> = {
      courseid: courseId,
      fsname: feedbackSessionName,
    };

    return this.httpRequestService.post(ResourceEndpoints.SESSION_PUBLISH, paramMap);
  }

  /**
   * Unpublishes a feedback session.
   */
  unpublishFeedbackSession(courseId: string, feedbackSessionName: string): Observable<FeedbackSession> {
    const paramMap: Record<string, string> = {
      courseid: courseId,
      fsname: feedbackSessionName,
    };

    return this.httpRequestService.delete(ResourceEndpoints.SESSION_PUBLISH, paramMap);
  }

  /**
   * Load session statistics.
   */
  loadSessionStatistics(courseId: string, feedbackSessionName: string): Observable<FeedbackSessionStats> {
    const paramMap: Record<string, string> = {
      courseid: courseId,
      fsname: feedbackSessionName,
    };

    return this.httpRequestService.get(ResourceEndpoints.SESSION_STATS, paramMap);
  }

  /**
   * Download session results.
   */
  downloadSessionResults(courseId: string,
                         feedbackSessionName: string,
                         userIntent: string,
                         indicateMissingResponses: boolean,
                         showStatistics: boolean): Observable<any> {
    const paramMap: Record<string, string> = {
      courseid: courseId,
      fsname: feedbackSessionName,
      intent: userIntent,
      frindicatemissingresponses: indicateMissingResponses ? 'true' : 'false',
      frshowstats: showStatistics ? 'true' : 'false',
    };

    return this.httpRequestService.get(ResourceEndpoints.RESULT_CSV, paramMap, 'text');
  }

  /**
   * Retrieves the results for a feedback session.
   */
  getFeedbackSessionResults(queryParams: {
    courseId: string,
    feedbackSessionName: string,
    intent: Intent
    questionId?: string,
    groupBySection?: string,
    key?: string,
  }): Observable<SessionResults> {
    const paramMap: Record<string, string> = {
      courseid: queryParams.courseId,
      fsname: queryParams.feedbackSessionName,
      intent: queryParams.intent,
    };

    if (queryParams.questionId) {
      paramMap.questionid = queryParams.questionId;
    }

    if (queryParams.groupBySection) {
      paramMap.frgroupbysection = queryParams.groupBySection;
    }

    if (queryParams.key) {
      paramMap.key = queryParams.key;
    }

    return this.httpRequestService.get(ResourceEndpoints.RESULT, paramMap);
  }

  /**
   * Soft delete a session by moving it to the recycle bin.
   */
  moveSessionToRecycleBin(courseId: string, feedbackSessionName: string): Observable<any> {
    const paramMap: Record<string, string> = {
      courseid: courseId,
      fsname: feedbackSessionName,
    };

    return this.httpRequestService.put(ResourceEndpoints.BIN_SESSION, paramMap);
  }

  /**
   * Removes a session from the recycle bin.
   */
  deleteSessionFromRecycleBin(courseId: string, feedbackSessionName: string): Observable<FeedbackSession> {
    const paramMap: Record<string, string> = {
      courseid: courseId,
      fsname: feedbackSessionName,
    };

    return this.httpRequestService.delete(ResourceEndpoints.BIN_SESSION, paramMap);
  }

  sendFeedbackSessionLinkToRecoveryEmail(queryParam: {
    sessionLinksRecoveryEmail: string,
    captchaResponse: string,
  }): Observable<SessionLinksRecoveryResponse> {
    const paramMap: Record<string, string> = {
      sessionlinksrecoveryemail: queryParam.sessionLinksRecoveryEmail,
      captcharesponse: queryParam.captchaResponse,
    };

    return this.httpRequestService.post(ResourceEndpoints.SESSION_LINKS_RECOVERY, paramMap);
  }

  /**
   * Checks if a given feedback session is still open.
   */
  isFeedbackSessionOpen(feedbackSession: FeedbackSession): boolean {
    const date: number = Date.now();
    return date >= feedbackSession.submissionStartTimestamp && date < feedbackSession.submissionEndTimestamp;
  }

  /**
   * Checks if a given feedback session is published.
   */
  isFeedbackSessionPublished(feedbackSession: FeedbackSession): boolean {
    return feedbackSession.publishStatus === FeedbackSessionPublishStatus.PUBLISHED;
  }

  /**
   * Generates the name fragment of a feedbackSession for display on the frontend.
   */
  generateNameFragment(feedbackSession: FeedbackSession): string {
    const DATE_FORMAT_WITH_ZONE_INFO: string = 'ddd, DD MMM yyyy, hh:mm A Z';
    const startTime: string = this.timezoneService
        .formatToString(feedbackSession.submissionStartTimestamp, feedbackSession.timeZone, DATE_FORMAT_WITH_ZONE_INFO);
    const endTime: string = this.timezoneService
        .formatToString(feedbackSession.submissionEndTimestamp, feedbackSession.timeZone, DATE_FORMAT_WITH_ZONE_INFO);
    return `${feedbackSession.feedbackSessionName} ${startTime}-${endTime}`;
  }
}
