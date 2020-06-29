import { FeedbackResponseCommentService } from '../../services/feedback-response-comment.service';
import { StatusMessageService } from '../../services/status-message.service';
import {
    FeedbackResponseComment,
    FeedbackSession, FeedbackSessionPublishStatus, FeedbackSessionSubmissionStatus,
    ResponseVisibleSetting,
    SessionVisibleSetting,
} from '../../types/api-output';
import { Intent } from '../../types/api-request';
import { CommentRowModel } from '../components/comment-box/comment-row/comment-row.component';
import { CommentTableModel } from '../components/comment-box/comment-table/comment-table.component';
import { CommentToCommentRowModelPipe } from '../components/comment-box/comment-to-comment-row-model.pipe';
import { ErrorMessageOutput } from '../error-message-output';

/**
 * Base class for instructor comment CRUD operations.
 */
export abstract class InstructorCommentsComponent {

  session: FeedbackSession = {
    courseId: '',
    timeZone: '',
    feedbackSessionName: '',
    instructions: '',
    submissionStartTimestamp: 0,
    submissionEndTimestamp: 0,
    gracePeriod: 0,
    sessionVisibleSetting: SessionVisibleSetting.AT_OPEN,
    responseVisibleSetting: ResponseVisibleSetting.AT_VISIBLE,
    submissionStatus: FeedbackSessionSubmissionStatus.OPEN,
    publishStatus: FeedbackSessionPublishStatus.NOT_PUBLISHED,
    isClosingEmailEnabled: true,
    isPublishedEmailEnabled: true,
    createdAtTimestamp: 0,
  };
  currInstructorName?: string;

  // this is a separate model for instructor comments
  // from responseID to comment table model
  instructorCommentTableModel: Record<string, CommentTableModel> = {};

  protected constructor(
        protected commentToCommentRowModel: CommentToCommentRowModelPipe,
        protected commentService: FeedbackResponseCommentService,
        protected statusMessageService: StatusMessageService) { }

  /**
   * Deletes an instructor comment.
   */
  deleteComment(data: { responseId: string, index: number}): void {
    const commentTableModel: CommentTableModel = this.instructorCommentTableModel[data.responseId];
    const commentToDelete: FeedbackResponseComment =
            // tslint:disable-next-line:no-non-null-assertion
            this.instructorCommentTableModel[data.responseId].commentRows[data.index].originalComment!;

    this.commentService.deleteComment(commentToDelete.feedbackResponseCommentId, Intent.INSTRUCTOR_RESULT)
        .subscribe(() => {
          commentTableModel.commentRows.splice(data.index, 1);
          this.instructorCommentTableModel[data.responseId] = {
            ...commentTableModel,
          };
        }, (resp: ErrorMessageOutput) => {
          this.statusMessageService.showErrorToast(resp.error.message);
        });
  }

  /**
   * Updates an instructor comment.
   */
  updateComment(data: { responseId: string, index: number}): void {
    const commentTableModel: CommentTableModel = this.instructorCommentTableModel[data.responseId];
    const commentRowToUpdate: CommentRowModel = commentTableModel.commentRows[data.index];
    // tslint:disable-next-line:no-non-null-assertion
    const commentToUpdate: FeedbackResponseComment = commentRowToUpdate.originalComment!;

    this.commentService.updateComment({
      commentText: commentRowToUpdate.commentEditFormModel.commentText,
      showCommentTo: commentRowToUpdate.commentEditFormModel.showCommentTo,
      showGiverNameTo: commentRowToUpdate.commentEditFormModel.showGiverNameTo,
    }, commentToUpdate.feedbackResponseCommentId, Intent.INSTRUCTOR_RESULT)
        .subscribe((commentResponse: FeedbackResponseComment) => {
          commentTableModel.commentRows[data.index] = this.commentToCommentRowModel.transform({
            ...commentResponse,
            commentGiverName: commentRowToUpdate.commentGiverName,
            // the current instructor will become the last editor
            lastEditorName: this.currInstructorName,
          }, this.session.timeZone);
          this.instructorCommentTableModel[data.responseId] = {
            ...commentTableModel,
          };
        }, (resp: ErrorMessageOutput) => {
          this.statusMessageService.showErrorToast(resp.error.message);
        });
  }

  /**
   * Saves an instructor comment.
   */
  saveNewComment(responseId: string): void {
    const commentTableModel: CommentTableModel = this.instructorCommentTableModel[responseId];
    const commentRowToAdd: CommentRowModel = commentTableModel.newCommentRow;

    this.commentService.createComment({
      commentText: commentRowToAdd.commentEditFormModel.commentText,
      showCommentTo: commentRowToAdd.commentEditFormModel.showCommentTo,
      showGiverNameTo: commentRowToAdd.commentEditFormModel.showGiverNameTo,
    }, responseId, Intent.INSTRUCTOR_RESULT)
        .subscribe((commentResponse: FeedbackResponseComment) => {
          commentTableModel.commentRows.push(this.commentToCommentRowModel.transform({
            ...commentResponse,
            // the giver and editor name will be the current login instructor
            commentGiverName: this.currInstructorName,
            lastEditorName: this.currInstructorName,
          }, this.session.timeZone));
          this.instructorCommentTableModel[responseId] = {
            ...commentTableModel,
            newCommentRow: {
              commentEditFormModel: {
                commentText: '',
                isUsingCustomVisibilities: false,
                showCommentTo: [],
                showGiverNameTo: [],
              },
              isEditing: false,
            },
            isAddingNewComment: false,
          };
        }, (resp: ErrorMessageOutput) => {
          this.statusMessageService.showErrorToast(resp.error.message);
        });
  }
}
