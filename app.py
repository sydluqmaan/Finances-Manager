import pandas as pd
import matplotlib
from matplotlib import pyplot as plt
import datetime as dt
import eel
import os.path
from os import listdir
import os
import threading
import time
import calendar
import numpy as np

matplotlib.use('agg')

opnfilename = None
isnewname = False
newname = None
df = None
filenames = listdir()
filenames = [filename for filename in filenames if filename.endswith('.csv')]

@eel.expose
def programexit():
    os._exit(0)

@eel.expose
def savefile():
      df.to_csv(opnfilename,index=False)
      if isnewname == True:
            os.rename(opnfilename,newname)

@eel.expose
def newsheet():
      global opnfilename
      global df
      df = None

      defaultfilename = 'sheet.csv'
      filenamecount = 1
      while (os.path.isfile(defaultfilename)):
            defaultfilename = 'sheet' + str(filenamecount) + '.csv'
            filenamecount += 1
      
      with open(defaultfilename, 'w') as file:
            file.write('id,event,date,amount,category')

      eel.insufficientdata()
      eel.updatebalance(0)
      eel.clear_year_data()
      opnfilename = defaultfilename
      df = pd.read_csv(defaultfilename)
      eel.setsheetnameininputbox(defaultfilename[:-4])
      eel.updatelastid(0)

@eel.expose
def opensheet(filename):
      global opnfilename
      global df
      opnfilename = filename
      df = pd.read_csv(filename)
      df['date'] = pd.to_datetime(df['date'])
      df.sort_values(by = 'date', ascending = True, inplace = True)

      data = df.to_numpy().tolist()
      for x in data:
            x[2] = x[2].strftime('%Y-%m-%d')

      eel.loadsheetrecords(data,opnfilename[:-4])

@eel.expose
def getlastid():
      return len(df.index)

@eel.expose
def updatesheetname(name):
      global opnfilename, newname, isnewname
      newname = name+".csv"
      isnewname = True

@eel.expose
def updaterecord(id,record):
      global df
      if id in (df['id'].tolist()):
            df.loc[df['id'] == id] = [id]+record
      else:
            df.loc[len(df)] = ([id]+record)
      os.system('cls' if os.name == 'nt' else 'clear')

@eel.expose
def poprecord(id):
      global df
      if id in (df['id'].tolist()):
            df.drop(df.loc[df['id'] == id].index, inplace = True)

def get_intvl_dates(intvl):
      startdate,enddate=None,None
      year = int(intvl[0:4])
      month = int(intvl[5:])
      today = pd.to_datetime(dt.date.today())
      selectordate= dt.datetime(year, month,1)

      if selectordate.year == today.year & selectordate.month == today.month:
            startdate = (calendar.monthrange(selectordate.year,selectordate.month))[0]
            enddate = today
      
      else:
            startdate = 1
            enddate = (calendar.monthrange(selectordate.year,selectordate.month))[1]

      startdate = dt.datetime(year,month,startdate)
      enddate = dt.datetime(year,month,enddate)

      return enddate,startdate

#Total balance up until date
def balance_before_date(intvl):
      today, prevdate = get_intvl_dates(intvl)
      baluptorecords = df.loc[(df['date'] < prevdate)]
      balupto = baluptorecords['amount'].sum()
      
      return balupto

#This Slices records at specified timestamps
def slicerecords(intvl):
      today, prevdate = get_intvl_dates(intvl)
      deltarecords = df.loc[(df['date'] >= prevdate) & (df['date'] <= today)]

      return deltarecords

#Sort between expenditure and income
def sort_by_transaction_type(transtype, dataframe):
      match transtype:
            case False:
                  data =  dataframe.loc[(dataframe['amount'] < 0)]
            case True:
                  data =  dataframe.loc[(dataframe['amount'] > 0)]
      return data

# Groups expenditure by category
def sortbycat(dataframe):
      bal = 0
      categories = list(set(dataframe['category'].tolist()))
      spendings = []
      
      for cat in categories:
            for index, row in dataframe.iterrows():
                  if row.category == cat:
                        bal = bal - row.amount
            spendings.append(round(bal,4))
            bal = 0
      
      return categories,spendings

def plotpiechart(categories,spendings,svgname,color):
      fig = plt.figure()
      fig.patch.set_facecolor('0')
      plt.rcParams['text.color'] = '#DBD5B5'
      hole = plt.Circle((0, 0), 0.35, facecolor='#141514')

      plt.pie(spendings, labels = categories, labeldistance = 1.2, autopct = '%1.0f%%', pctdistance = 0.80, textprops = {'fontsize':14}, colors = color, wedgeprops = {"linewidth": 3, "edgecolor": "#141514"})
      plt.gcf().gca().add_artist(hole)
      plt.savefig(f"web\{svgname}.svg", transparent=True)

def plotgraph(dataframe,balupto=0):

      data = dataframe.groupby(dataframe['date'].dt.day).sum("amount").reset_index()
      dates = data['date'].tolist()
      b = data['amount'].tolist()
      dates.insert(0,0)
      b.insert(0,0)

      balancerecord=[b[0]]
      i=1
      for x in b[1:]:
            balancerecord.append(balancerecord[i-1]+x)
            i+=1

      plt.figure(facecolor = '#141514')

      ax = plt.axes()
      for i in range(1, len(balancerecord)):
            y1 = balancerecord[i-1]
            y2 = balancerecord[i]
            x1 = dates[i-1]
            x2 = dates[i]

            slope = y2-y1/1
            if slope>1:
                  c ='#44AF69'
            else:
                  c ='#F8333C'
            plt.plot([x1,x2],[y1,y2] , color = c, marker = 'o', ms = 5, linestyle = 'solid', lw = '2' )
      
      ax.xaxis.set_tick_params(rotation=25, labelsize=10)
      ax.xaxis.label.set_color('#DBD5B5')
      ax.yaxis.label.set_color('#DBD5B5')
      ax.tick_params(axis='x', colors='#DBD5B5')
      ax.tick_params(axis='y', colors='#DBD5B5')      
      plt.ylabel('Balance')
      plt.xlabel('Date')
      plt.grid(color = '#DBD5B5', alpha=.25 , linestyle = '--', linewidth = 0.7)
      ax.set_facecolor('#141514')
      plt.xticks(np.arange(min(dates), max(dates)+1, 2))
      
      plt.savefig("web\mygraph.svg", transparent=True)

def organize_exp_by_cat(sliceddataframe):
      cat,rec = sortbycat(sort_by_transaction_type(False, sliceddataframe))
      eel.updateexpenditurebycategory([cat,[ -1*x for x in rec]])

def organize_inc_by_cat(sliceddataframe):
      cat,rec = sortbycat(sort_by_transaction_type(True, sliceddataframe))
      eel.updateincomebycategory([cat,[ -1*x for x in rec]])

def calculate_balance():
      total = df['amount'].sum()
      total = "{:.2f}".format(total)
      eel.updatebalance(total)

def expenditure_piechart(dataframe):
      d = sortbycat(dataframe)
      plotpiechart(d[0], d[1], "mypiegraph", ['#F72631', '#F72631', '#F72631', '#F72631','#F72631','#F72631'])

      plt.figure().clear()

def update_exp_amnt(dataframe):
      expenditure = (dataframe)['amount'].sum()
      eel.updateexpenditure("{:.2f}".format(expenditure))

      return expenditure

def income_piechart(dataframe):
      d = sortbycat(dataframe)
      plotpiechart(d[0],[ -1*x for x in d[1]], "mypiegraphincome", ['#44AF69', '#44AF69', '#44AF69', '#44AF69', '#44AF69', '#44AF69'])

      eel.piechartupdate()

      plt.figure().clear()

def update_inc_amnt(dataframe):
      income = (dataframe)['amount'].sum()
      eel.updateincome("{:.2f}".format(income))

      return income

def find_most_spent_cat(period):
      sliceddataframe=slicerecords(period)
      cat,rec = sortbycat(sliceddataframe)
      mostspentcatid = np.array(rec).argmax()
      mostspentcategory = cat[mostspentcatid]
      return mostspentcategory

def average_spending(period):
      spendings_monthly_average = []
      for x in range(1,12):
            date = dt.datetime(int(period[0:4]), x, 1)
            sliceddataframe = slicerecords(str(date.year) + "-" + str(date.month))
            dataframe = sort_by_transaction_type(False, sliceddataframe)
            totalexp = (dataframe)['amount'].sum()
            if totalexp != 0:
                  spendings_monthly_average.append(totalexp)

      if len(spendings_monthly_average) != 0:
            average_expenditure_year = sum(spendings_monthly_average) / len(spendings_monthly_average)
            average_expenditure_year = format(average_expenditure_year,".2f") 

      else:
            average_expenditure_year = '--'


      return average_expenditure_year

def average_income(period):
      monthlyaverageincome = []
      for x in range(1,12):
            date = dt.datetime(int(period[0:4]), x, 1)
            sliceddataframe = slicerecords(str(date.year) + "-" + str(date.month))
            dataframe = sort_by_transaction_type(True, sliceddataframe)
            totalinc = (dataframe)['amount'].sum()
            if totalinc != 0:
                  monthlyaverageincome.append(totalinc)

      if len(monthlyaverageincome) != 0:
            average_income_year = sum(monthlyaverageincome) / len(monthlyaverageincome)
            average_income_year = format(average_income_year,".2f")

      else:
            average_income_year = "--"

      return average_income_year

def exp_statement(sliceddataframe,expenditure):
      dataframe = sort_by_transaction_type(False, sliceddataframe)
      prev_month_spending = (dataframe)['amount'].sum()
      prev_curr_month_exp_diff = expenditure - prev_month_spending
      if prev_month_spending != 0:
            exp_diff_percent = format(abs(( prev_curr_month_exp_diff * 100 ) / prev_month_spending) ,".2f") + "%"
            prev_curr_month_exp_diff = format(prev_curr_month_exp_diff,".2f")
      else:
            exp_diff_percent = "--"
            prev_curr_month_exp_diff = ""  

      return exp_diff_percent,prev_curr_month_exp_diff

def inc_statement(sliceddataframe,income):
      dataframe = sort_by_transaction_type(True, sliceddataframe)
      prev_month_income = (dataframe)['amount'].sum()
      prev_curr_month_inc_diff = income - prev_month_income
      if prev_month_income != 0:
            income_diff_percent = format(abs(( prev_curr_month_inc_diff * 100 ) / prev_month_income) ,".2f") + "%"
            prev_curr_month_inc_diff = format(prev_curr_month_inc_diff,".2f")
      else:
            income_diff_percent = "--"
            prev_curr_month_inc_diff = ""

      return income_diff_percent,prev_curr_month_inc_diff

@eel.expose
def updateanalytics(period):
      df['date'] = pd.to_datetime(df['date'])
      sliceddataframe=slicerecords(period)
      
      if len(sliceddataframe) == 0:
            eel.insufficientdata()
            return 0
      
      eel.showvisuals()
      balupto = balance_before_date(period)

      # Organize expenditure by category
      organize_exp_by_cat(sliceddataframe)

      # Organize Income by category
      organize_inc_by_cat(sliceddataframe)

      # Calculate current balance
      calculate_balance()

      # All spendings from slicedframe
      dataframe = sort_by_transaction_type(False,sliceddataframe)

      expenditure = update_exp_amnt(dataframe)

      #Expenditure Pie chart
      expenditure_piechart(dataframe)

      # All savings from slicedframe
      dataframe = sort_by_transaction_type(True, sliceddataframe)

      income = update_inc_amnt(dataframe)

      # Income Pie chart
      income_piechart(dataframe)

      #Graph
      plotgraph(sliceddataframe,balupto)
      eel.graphupdate()
            
      # Category most spent on
      mostspentcategory = find_most_spent_cat(period)

      ##Statements
      date = dt.datetime(int(period[0:4]), int(period[5:]), 1)
      prevmonth = date - dt.timedelta(days = 1)
      sliceddataframe = slicerecords(str(prevmonth.year) + "-" + str(prevmonth.month))

      #Expenditure statement
      exp_diff_percent, prev_curr_month_exp_diff = exp_statement(sliceddataframe,expenditure)

      #Income statement
      income_diff_percent,prev_curr_month_inc_diff = inc_statement(sliceddataframe,income)

      # Average Spending statement
      average_expenditure_year = average_spending(period)

      # Average Income Statement
      average_income_year  = average_income(period)

      eel.statementupdate(prev_curr_month_exp_diff, prev_curr_month_inc_diff, average_expenditure_year, average_income_year, mostspentcategory, income_diff_percent, exp_diff_percent)

      return 1

# Init browser
def startbrowser():
      eel.init(f'{os.path.dirname(os.path.realpath(__file__))}/web')
      eel.start('index.html', mode = 'edge', port = 0)

t = threading.Thread(target = startbrowser, args = ())
t.start()

time.sleep(1)

# Open file on starup
if (len(filenames) > 0):
      opensheet(filenames[0])
      
else:
      newsheet()