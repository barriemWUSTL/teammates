import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { CourseService } from '../../../services/course.service';
import { FeedbackSessionsService } from '../../../services/feedback-sessions.service';
import { LoadingBarService } from '../../../services/loading-bar.service';
import { StatusMessageService } from '../../../services/status-message.service';
import { TimezoneService } from '../../../services/timezone.service';
import {
  Course,
  Courses,
  FeedbackSession,
  FeedbackSessionPublishStatus,
  FeedbackSessions,
  FeedbackSessionSubmissionStatus,
  HasResponses,
} from '../../../types/api-output';
import { ErrorMessageOutput } from '../../error-message-output';

interface StudentCourse {
  course: Course;
  feedbackSessions: StudentSession[];
}

interface StudentSession {
  session: FeedbackSession;
  isOpened: boolean;
  isWaitingToOpen: boolean;
  isPublished: boolean;
  isSubmitted: boolean;
}

/**
 * Student home page.
 */
@Component({
  selector: 'tm-student-home-page',
  templateUrl: './student-home-page.component.html',
  styleUrls: ['./student-home-page.component.scss'],
})
export class StudentHomePageComponent implements OnInit {

  // Tooltip messages
  studentFeedbackSessionStatusPublished: string =
      'The responses for the session have been published and can now be viewed.';
  studentFeedbackSessionStatusNotPublished: string =
      'The responses for the session have not yet been published and cannot be viewed.';
  studentFeedbackSessionStatusAwaiting: string =
      'The session is not open for submission at this time. It is expected to open later.';
  studentFeedbackSessionStatusPending: string = 'The feedback session is yet to be completed by you.';
  studentFeedbackSessionStatusSubmitted: string = 'You have submitted your feedback for this session.';
  studentFeedbackSessionStatusClosed: string = ' The session is now closed for submissions.';

  courses: StudentCourse[] = [];

  constructor(private route: ActivatedRoute,
              private courseService: CourseService,
              private statusMessageService: StatusMessageService,
              private feedbackSessionsService: FeedbackSessionsService,
              private timezoneService: TimezoneService,
              private loadingBarService: LoadingBarService) {
    this.timezoneService.getTzVersion();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(() => {
      this.getStudentCourses();
    });
  }

  /**
   * Gets the courses and feedback sessions involving the student.
   */
  getStudentCourses(): void {
    this.loadingBarService.showLoadingBar();
    this.courseService.getAllCoursesAsStudent().subscribe((resp: Courses) => {
      if (resp.courses.length === 0) {
        this.loadingBarService.hideLoadingBar();
        return;
      }
      for (const course of resp.courses) {
        this.feedbackSessionsService.getFeedbackSessionsForStudent(course.courseId)
          .pipe(finalize(() => this.loadingBarService.hideLoadingBar()))
          .subscribe((fss: FeedbackSessions) => {
            const sortedFss: FeedbackSession[] = this.sortFeedbackSessions(fss);

            const studentSessions: StudentSession[] = [];
            for (const fs of sortedFss) {
              const isOpened: boolean = fs.submissionStatus === FeedbackSessionSubmissionStatus.OPEN;
              const isWaitingToOpen: boolean =
                fs.submissionStatus === FeedbackSessionSubmissionStatus.VISIBLE_NOT_OPEN;
              const isPublished: boolean = fs.publishStatus === FeedbackSessionPublishStatus.PUBLISHED;
              this.feedbackSessionsService.hasStudentResponseForFeedbackSession(course.courseId,
                fs.feedbackSessionName)
                .subscribe((hasRes: HasResponses) => {
                  const isSubmitted: boolean = hasRes.hasResponses;
                  studentSessions.push(Object.assign({},
                    { isOpened, isWaitingToOpen, isPublished, isSubmitted, session: fs }));
                });
            }

            this.courses.push(Object.assign({}, { course, feedbackSessions: studentSessions }));
            this.courses.sort((a: StudentCourse, b: StudentCourse) =>
              (a.course.courseId > b.course.courseId) ? 1 : -1);
          });
      }
    }, (e: ErrorMessageOutput) => {
      this.statusMessageService.showErrorToast(e.error.message);
    });
  }

  /**
   * Gets the tooltip message for the submission status.
   */
  getSubmissionStatusTooltip(session: StudentSession): string {
    let msg: string = '';

    if (session.isWaitingToOpen) {
      msg += this.studentFeedbackSessionStatusAwaiting;
    } else if (session.isSubmitted) {
      msg += this.studentFeedbackSessionStatusSubmitted;
    } else {
      msg += this.studentFeedbackSessionStatusPending;
    }
    if (!session.isOpened && !session.isWaitingToOpen) {
      msg += this.studentFeedbackSessionStatusClosed;
    }
    return msg;
  }

  /**
   * Gets the tooltip message for the response status.
   */
  getResponseStatusTooltip(isPublished: boolean): string {
    if (isPublished) {
      return this.studentFeedbackSessionStatusPublished;
    }
    return this.studentFeedbackSessionStatusNotPublished;
  }

  /**
   * Sorts the feedback sessions based on creation and end timestamp.
   */
  sortFeedbackSessions(fss: FeedbackSessions): FeedbackSession[] {
    return fss.feedbackSessions
        .map((fs: FeedbackSession) => Object.assign({}, fs))
        .sort((a: FeedbackSession, b: FeedbackSession) => (a.createdAtTimestamp >
            b.createdAtTimestamp) ? 1 : (a.createdAtTimestamp === b.createdAtTimestamp) ?
            ((a.submissionEndTimestamp > b.submissionEndTimestamp) ? 1 : -1) : -1);
  }
}
